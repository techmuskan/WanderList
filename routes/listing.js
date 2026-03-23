const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync');
const Listing = require('../models/listing');
const { isLoggedIn, saveRedirectUrl, isOwner, validateListing } = require('../middleware');
const listingController = require('../controllers/listings');   
const multer = require('multer');
const { storage } = require('../cloudConfig');
const upload = multer({ storage });

const uploadSingle = (req, res, next) => {
    upload.single("listing[image]")(req, res, (err) => {
        if (err) {
            console.error("Image upload error:", err);
            req.flash('error', 'Image upload failed. Please try again or use an image URL.');
            return res.redirect('back');
        }
        console.log("Upload debug:", {
            hasFile: Boolean(req.file),
            fileField: req.file?.fieldname,
            bodyKeys: Object.keys(req.body || {}),
            listingKeys: req.body?.listing ? Object.keys(req.body.listing) : []
        });
        next();
    });
};

router.route("/")
.get(wrapAsync(listingController.index)) // Index Route - populated owner to display usernames if needed
.post(isLoggedIn, uploadSingle, validateListing, wrapAsync(listingController.create));// Create Route


// New Form Render Route
router.get("/new", isLoggedIn, saveRedirectUrl, listingController.newFormRender)

router.route("/:id")
.get(wrapAsync(listingController.show)) // Show Route - populate owner and reviews
.put(isLoggedIn, isOwner, uploadSingle, validateListing, wrapAsync(listingController.update)) // Update Route
.delete(isLoggedIn, isOwner, wrapAsync(listingController.delete)); // Delete Route

// Edit Route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.edit));


module.exports = router;
