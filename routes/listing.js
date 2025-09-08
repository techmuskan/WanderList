const express = require('express');
const router = express.Router();

// Index Route
router.get("/", wrapAsync(async(req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
})
);

// New Route
router.get("/new", (req, res) => {
    res.render("listings/new.ejs");
});

// Show Route
router.get("/:id", wrapAsync(async(req, res) => {
    const listing = await Listing.findById(req.params.id).populate('reviews');
    res.render("listings/show.ejs", { listing });
})); 

// Create Route
router.post(
    "/", validateListing, wrapAsync(async (req, res, next) => {
      let result = listingSchema.validate(req.body);
      if (result.error) {
        throw new ExpressError(result.error.message, 400);
      }
      const newListing = new Listing(req.body.listing);
      await newListing.save();
      res.redirect("/listings");
    })
);

// Edit Route
router.get("/:id/edit", wrapAsync(async(req, res) => {
    const listing = await Listing.findById(req.params.id);
    res.render("listings/edit.ejs", { listing });
}));

// Update Route
router.put("/:id", validateListing, wrapAsync(async(req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndUpdate(id, {...req.body.listing});
    res.redirect(`/listings/${id}`);   
})
);

// Delete Route
router.delete("/:id", wrapAsync(async(req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
}));

module.exports = router;