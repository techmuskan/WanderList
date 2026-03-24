const express = require('express');
const router = express.Router({ mergeParams: true }); // access :id from listings
const wrapAsync = require('../utils/wrapAsync');
const ExpressError = require('../utils/ExpressError');
const { reviewSchema } = require("../schema");
const Review = require('../models/review');
const Listing = require('../models/listing');
const { isLoggedIn, validateReview, isReviewAuthor } = require('../middleware');
const reviewController = require('../controllers/reviews');

// Create Review
router.post("/", isLoggedIn, validateReview, wrapAsync(reviewController.createReview));

// Delete Review
router.delete("/:reviewId",isLoggedIn, isReviewAuthor, wrapAsync(reviewController.destroyReview));

module.exports = router;
