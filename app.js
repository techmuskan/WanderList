const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');

const ExpressError = require('./utils/ExpressError');

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

// ROUTES
const listings = require('./routes/listing');
app.use('/listings', listings);
const reviews = require('./routes/review');
app.use('/listings/:id/reviews', reviews);

app.get('/', (req, res) => {
    res.send("Hello I'm a server");
});





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
