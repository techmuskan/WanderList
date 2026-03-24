if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const mongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const ExpressError = require('./utils/ExpressError');

// TRUST PROXY (needed for secure cookies behind proxy)
if (process.env.NODE_ENV === "production") {
    app.set('trust proxy', 1);
}

const sessionSecret = process.env.SECRET || "devsecret-change-me";
const rawAtlasUrl = process.env.ATLASDB_URL || "";
const envDbName = process.env.DB_NAME || "";
const parsedDbName = (() => {
    const match = rawAtlasUrl.match(/\/([^/?]+)(\?|$)/);
    return match ? match[1] : "";
})();
const dbName = envDbName || parsedDbName || "WanderList";
const isAtlasPlaceholder = /yourpassword123|<db_password>|<db_username>/i.test(rawAtlasUrl);

// DB URL (shared by app + session store)
const dbURL = rawAtlasUrl && !isAtlasPlaceholder
    ? rawAtlasUrl
    : 'mongodb://127.0.0.1:27017/WanderList';

if (!rawAtlasUrl || isAtlasPlaceholder) {
    console.warn("⚠️  ATLASDB_URL missing/placeholder. Using local MongoDB for both app and session store.");
}

// Create a single mongoose connection promise and reuse for session store
const mongooseConnectOptions = parsedDbName ? {} : { dbName };
const mongooseConnectionPromise = mongoose.connect(dbURL, mongooseConnectOptions);

const useMemoryStore = process.env.USE_MEMORY_STORE === "true";

let store;
if (useMemoryStore) {
    console.warn("⚠️  Using in-memory session store. Sessions will reset on restart.");
    store = new session.MemoryStore();
} else {
    store = mongoStore.create({
        clientPromise: mongooseConnectionPromise.then(m => m.connection.getClient()),
        dbName,
        touchAfter: 24 * 60 * 60 // 24h
    });
    store.on("error", (e) => {
        console.log("SESSION STORE ERROR", e);
    });
}

// SESSION CONFIG
const sessionOptions = {
    store,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // HTTPS only in prod
        sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
};
app.use(session(sessionOptions));
app.use(flash());

// VIEW ENGINE
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// MIDDLEWARE
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(methodOverride('_method'));

// PASSPORT CONFIG
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy({ usernameField: 'identifier' }, async (identifier, password, done) => {
    try {
        const user = await User.findOne({
            $or: [{ username: identifier }, { email: identifier }]
        });
        if (!user) {
            return done(null, false, { message: 'Invalid username/email or password.' });
        }
        user.authenticate(password, (err, userAuth, passwordErr) => {
            if (err) return done(err);
            if (passwordErr) {
                return done(null, false, { message: 'Invalid username/email or password.' });
            }
            return done(null, userAuth);
        });
    } catch (err) {
        return done(err);
    }
}));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// GLOBAL VARIABLES FOR EJS
app.use((req, res, next) => {
    res.locals.currentUser = req.user || null;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentRoute = req.path;
    res.locals.mapToken = process.env.MAP_TOKEN;
    res.locals.searchQuery = req.query.q || '';
    next();
});

// MONGOOSE CONNECTION
mongooseConnectionPromise
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Error:", err));

// ROUTES
const listingRouter = require('./routes/listing');
const reviewRouter = require('./routes/review');
const usersRouter = require('./routes/user');

app.use('/listings', listingRouter);
app.use('/listings/:id/reviews', reviewRouter);
app.use('/', usersRouter);
// Fallback route to ensure forgot page is reachable
app.get('/forgot', (req, res) => res.render('users/forgot'));

// 404 HANDLER
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

// ERROR HANDLER
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Something went wrong!";
    res.status(statusCode).render('error', { err });
});

// START SERVER
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}`);
});
