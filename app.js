const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');

const Listing = require('./models/listing');
const Review = require('./models/review');
const wrapAsync = require('./utils/wrapAsync');
const ExpressError = require('./utils/ExpressError');
const { listingSchema, reviewSchema } = require("./schema");

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejsMate);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

mongoose.connect("mongodb://127.0.0.1:27017/WanderList")
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Error:", err));

// ROUTES
const listings = require('./routes/listing');
app.use('/listings', listings);

app.get('/', (req, res) => {
    res.send("Hello I'm a server");
});

// Middleware: Validate Review
const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body); // ✅ validate inside review
    if (error) {
        const errMsg = error.details.map(el => el.message).join(",");
        throw new ExpressError(errMsg, 400);
    }
    next();
};

// REVIEWS
app.post("/listings/:id/reviews", validateReview, wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    const newReview = new Review(req.body.review);
    listing.reviews.push(newReview);
    await Promise.all([newReview.save(), listing.save()]);
    res.redirect(`/listings/${listing._id}`);
}));

app.delete("/listings/:id/reviews/:reviewId", wrapAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await Promise.all([
        Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } }),
        Review.findByIdAndDelete(reviewId)
    ]);
    res.redirect(`/listings/${id}`);
}));

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
