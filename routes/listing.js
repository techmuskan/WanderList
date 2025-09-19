const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync');
const Listing = require('../models/listing');
const { isLoggedIn, saveRedirectUrl, isOwner, validateListing } = require('../middleware');
const listingController = require('../controllers/listings');   

// Index Route - populated owner to display usernames if needed
router.get("/", wrapAsync(listingController.index));

// New Form Render Route
router.get("/new", isLoggedIn, saveRedirectUrl, listingController.newFormRender);

// Show Route - populate owner and reviews
router.get("/:id", wrapAsync(listingController.show));

// Create Route
router.post("/", isLoggedIn, validateListing, wrapAsync(listingController.create));

// Edit Route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.edit));

// Update Route
router.put("/:id", isLoggedIn, isOwner, validateListing, wrapAsync(listingController.update));

// Delete Route
router.delete("/:id", isLoggedIn, isOwner, wrapAsync(listingController.delete));

module.exports = router;
