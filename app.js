if( process.env.NODE_ENV != "production"){
    require('dotenv').config()
};

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const session = require('express-session'); 
const ExpressError = require('./utils/ExpressError');
const sessionOptions = {
    secret : "mysupersecretcode",
    resave : false,
    saveUninitialized : true,
    cookie : {
        httpOnly : true,
        secure: process.env.NODE_ENV === "production",
        expires : Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
        maxAge : 1000 * 60 * 60 * 24 * 7
    }
};
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');


// VIEW ENGINE SETUP
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejsMate);

// MIDDLEWARE
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// MONGOOSE CONNECTION
mongoose.connect("mongodb://127.0.0.1:27017/WanderList")
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Error:", err));



app.use(session(sessionOptions));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentUser = req.user || null;  // <--- important fallback
    next();
});

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.mapToken = process.env.MAP_TOKEN;  // ✅ make available everywhere
  next();
});


// ROUTES
const listingRouter = require('./routes/listing');
app.use('/listings', listingRouter);
const reviewRouter = require('./routes/review');
app.use('/listings/:id/reviews', reviewRouter);
const usersRouter = require('./routes/user');
app.use('/', usersRouter);


// 404 Handler
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});


// Error Handler
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Something went wrong!";
    res.status(statusCode).render('error', { err });  // 👈 no "listings/"
});

app.listen(8080, () => {
    console.log("🚀 Server started on http://localhost:8080");
});
