const Listing = require('./models/listing');  // <-- Add this import
const { listingSchema } = require("./schema.js");
const ExpressError = require('./utils/ExpressError');
const { reviewSchema } = require("./schema.js");
const Review = require('./models/review');  // <-- Add this import

module.exports.isOwner = async (req, res, next) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash('error', 'Listing not found!');
        return res.redirect('/listings');
    }

    if (!listing.owner.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/listings/${id}`);
    }

    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl; // Save original URL
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
};

module.exports.validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);  // use Joi schema
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    }   
    next();
};

module.exports.validateReview = (req, res, next) => {
    // Ensure req.body.review exists
    if (!req.body.review) req.body.review = {};
    
    // Convert rating to number (since range input sends string)
    if (req.body.review.rating) {
        req.body.review.rating = Number(req.body.review.rating);
    }
    const { error } = reviewSchema.validate(req.body);  // use Joi schema
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    }
    next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);

    if (!review) {
        req.flash('error', 'Review not found!');
        return res.redirect('/listings');
    }   
    if (!review.author.equals(res.locals.currentUser._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/listings/${req.params.id}`);
    }
    next();
};
