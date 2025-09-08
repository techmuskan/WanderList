const express = require('express');
const router = express.Router({ mergeParams: true }); // access :id from listings
const wrapAsync = require('../utils/wrapAsync');
const ExpressError = require('../utils/ExpressError');
const { reviewSchema } = require("../schema");
const Review = require('../models/review');
const Listing = require('../models/listing');

// Middleware: Validate Review
const validateReview = (req, res, next) => {
    // Ensure req.body.review exists
    if (!req.body.review) req.body.review = {};
    
    // Convert rating to number (since range input sends string)
    if (req.body.review.rating) {
        req.body.review.rating = Number(req.body.review.rating);
    }

    const { error } = reviewSchema.validate(req.body, { convert: true });
    if (error) {
        const errMsg = error.details.map(el => el.message).join(", ");
        throw new ExpressError(errMsg, 400);
    }
    next();
};

// Create Review
router.post("/", validateReview, wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) throw new ExpressError("Listing not found", 404);

    const newReview = new Review(req.body.review);
    listing.reviews.push(newReview);

    await Promise.all([newReview.save(), listing.save()]);
    res.redirect(`/listings/${listing._id}`);
}));

// Delete Review
router.delete("/:reviewId", wrapAsync(async (req, res) => {
    const { id, reviewId } = req.params;

    const listing = await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    const deletedReview = await Review.findByIdAndDelete(reviewId);

    if (!listing || !deletedReview) {
        throw new ExpressError("Listing or Review not found", 404);
    }

    res.redirect(`/listings/${id}`);
}));

module.exports = router;
