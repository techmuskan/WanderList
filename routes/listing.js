const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync');
const Listing = require('../models/listing');
const { isLoggedIn, saveRedirectUrl, isOwner, validateListing, validateReview } = require('../middleware');

// Index Route - populated owner to display usernames if needed
router.get("/", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({}).populate('owner');
    res.render("listings/index.ejs", { allListings });
}));

// New Route
router.get("/new", isLoggedIn, saveRedirectUrl, (req, res) => {
    res.render("listings/new.ejs");
});

// Show Route - populate owner and reviews
router.get("/:id", wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id)
        .populate({
            path: 'reviews',
            populate: { path: 'author' }
        }).populate('owner');

    if (!listing) {
        req.flash('error', 'Cannot find that listing!');
        return res.redirect('/listings');
    }
    res.render("listings/show.ejs", { listing });
}));

// Create Route
router.post("/", isLoggedIn, validateListing, wrapAsync(async (req, res) => {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    await newListing.save();
    req.flash('success', 'Successfully made a new listing!');
    res.redirect("/listings");
}));

// Edit Route - populate owner if you need it in the form
// router.get("/:id/edit", isLoggedIn, wrapAsync(async (req, res) => {
//     const listing = await Listing.findById(req.params.id).populate('owner');
//     if (!listing) {
//         req.flash('error', 'Cannot find that listing!');
//         return res.redirect('/listings');
//     }
//     res.render("listings/edit.ejs", { listing });
// }));

// Edit Route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    res.render("listings/edit.ejs", { listing });
}));

// Update Route
// router.put("/:id", isLoggedIn, validateListing, wrapAsync(async (req, res) => {
//     let { id } = req.params;
//     let listing = Listing.findById(id); // Ensure listing exists
//     if (!currentUser && listing.owner.equals(currentUser._id)) {
//         req.flash('error', 'You do not have permission to do that!');
//         return res.redirect(`/listings/${id}`);
//     }   
//     const updatedListing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { runValidators: true });

//     if (!updatedListing) throw new ExpressError("Listing not found", 404);

//     req.flash('success', 'Successfully updated listing!');
//     res.redirect(`/listings/${id}`);
// }));

// Update Route
router.put("/:id", isLoggedIn, isOwner, validateListing, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const updatedListing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { runValidators: true, new: true });
    req.flash('success', 'Successfully updated listing!');
    res.redirect(`/listings/${id}`);
}));

// Delete Route
// router.delete("/:id", isLoggedIn, wrapAsync(async (req, res) => {
//     const { id } = req.params;
//     const listing = await Listing.findById(id);

//     if (!listing) {
//         req.flash('error', 'Listing not found');
//         return res.redirect('/listings');
//     }

//     if (!listing.owner || listing.owner.toString() !== req.user._id.toString()) {
//         req.flash('error', 'You do not have permission to delete this listing!');
//         return res.redirect(`/listings/${id}`);
//     }

//     await listing.deleteOne();
//     req.flash('success', 'Successfully deleted listing!');
//     res.redirect("/listings");
// }));

// Delete Route
router.delete("/:id", isLoggedIn, isOwner, wrapAsync(async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted listing!');
    res.redirect("/listings");
}));

module.exports = router;
