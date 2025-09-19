const express = require('express');
const router = express.Router({ mergeParams: true }); // access :id from listings
const wrapAsync = require('../utils/wrapAsync');
const ExpressError = require('../utils/ExpressError');
const { reviewSchema } = require("../schema");
const Review = require('../models/review');
const Listing = require('../models/listing');
const { isLoggedIn, validateReview, isReviewAuthor } = require('../middleware');


// Create Review
router.post("/", isLoggedIn, validateReview, wrapAsync(async (req, res) => {
    // Just fetch the listing (no populate needed yet)
    const listing = await Listing.findById(req.params.id);
    if (!listing) throw new ExpressError("Listing not found", 404);

    // Create new review
    const newReview = new Review(req.body.review);
    newReview.author = req.user._id;

    // Push into listing
    listing.reviews.push(newReview);

    // Save both
    await Promise.all([newReview.save(), listing.save()]);

    req.flash('success', 'Created new review!');
    res.redirect(`/listings/${listing._id}`);
}));



// Delete Review
router.delete("/:reviewId",isLoggedIn, isReviewAuthor, wrapAsync(async (req, res) => {
    const { id, reviewId } = req.params;

    const listing = await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    const deletedReview = await Review.findByIdAndDelete(reviewId);

    if (!listing || !deletedReview) {
        throw new ExpressError("Listing or Review not found", 404);
    }
    req.flash('success', 'Successfully deleted review!');
    res.redirect(`/listings/${id}`);
}));

module.exports = router;
