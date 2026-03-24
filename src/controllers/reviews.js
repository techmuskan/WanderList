// controllers/reviews.js
const Review = require('../models/review');   // Model, not route
const Listing = require('../models/listing'); // Model, not route
const ExpressError = require('../utils/ExpressError');

module.exports.createReview = async (req, res) => {
    const { id } = req.params; // listing id
    const listing = await Listing.findById(id);
    if (!listing) throw new ExpressError("Listing not found", 404);

    const newReview = new Review(req.body.review);
    newReview.author = req.user._id;

    listing.reviews.push(newReview._id); // push only the review ID
    await Promise.all([newReview.save(), listing.save()]);

    req.flash('success', 'Created new review!');
    res.redirect(`/listings/${listing._id}`);
}

module.exports.destroyReview = async (req, res) => {
    const { id, reviewId } = req.params;

    const listing = await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    const deletedReview = await Review.findByIdAndDelete(reviewId);

    if (!listing || !deletedReview) {
        throw new ExpressError("Listing or Review not found", 404);
    }

    req.flash('success', 'Successfully deleted review!');
    res.redirect(`/listings/${id}`);
}