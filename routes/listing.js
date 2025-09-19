const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync');
const Listing = require('../models/listing');
const { isLoggedIn, saveRedirectUrl, isOwner, validateListing } = require('../middleware');
const listingController = require('../controllers/listings');   
const multer = require('multer');
const{storage} = require('../cloudConfig');
const upload = multer({storage});

router.route("/")
.get(wrapAsync(listingController.index)) // Index Route - populated owner to display usernames if needed
.post(isLoggedIn, upload.single("listing[image]"), validateListing, wrapAsync(listingController.create));// Create Route


// New Form Render Route
router.get("/new", isLoggedIn, saveRedirectUrl, listingController.newFormRender)

router.route("/:id")
.get(wrapAsync(listingController.show)) // Show Route - populate owner and reviews
.put(isLoggedIn, isOwner, validateListing, wrapAsync(listingController.update)) // Update Route
.delete(isLoggedIn, isOwner, wrapAsync(listingController.delete)); // Delete Route

// Edit Route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.edit));


module.exports = router;
