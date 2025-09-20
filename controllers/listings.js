const Listing = require('../models/listing');  
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// List all listings
module.exports.index = async (req, res) => {
  const allListings = await Listing.find({}).populate('owner');
  res.render("listings/index.ejs", { allListings });
};

// Render new listing form
module.exports.newFormRender = (req, res) => {
  res.render("listings/new.ejs");
};

// Show a single listing
module.exports.show = async (req, res) => {
  const listing = await Listing.findById(req.params.id)
    .populate({ path: 'reviews', populate: { path: 'author' } })
    .populate('owner');

  if (!listing) {
    req.flash('error', 'Cannot find that listing!');
    return res.redirect('/listings');
  }

  res.render("listings/show", { listing, mapToken: process.env.MAP_TOKEN });

};

// Create a new listing
module.exports.create = async (req, res) => {
  try {
    if (!req.body.listing) throw new Error("Listing data missing!");

    // Default geometry
    let geometry = { type: "Point", coordinates: [77.4126, 23.2699] };

    // Geocode if location is provided
    if (req.body.listing.location) {
      const response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1
      }).send();
      const geoData = response.body.features[0];
      if (geoData) geometry = geoData.geometry;
    }

    // Create listing with defaults and geometry
    const listing = new Listing({
      ...req.body.listing,
      owner: req.user._id,
      geometry
    });

    // Image handling
    if (req.file?.path) {
      listing.image = { url: req.file.path, filename: req.file.filename };
    }

    await listing.save();
    req.flash("success", "Listing created successfully!");
    res.redirect("/listings");
  } catch (e) {
    console.error("Error creating listing:", e);
    req.flash("error", e.message || "Something went wrong!");
    res.redirect("/listings/new");
  }
};

// Render edit form
module.exports.edit = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      req.flash('error', 'Listing not found!');
      return res.redirect('/listings');
    }

    // Resize Cloudinary image for preview
    let originalImageURL = listing.image?.url || "/images/default.jpg";
    if (originalImageURL.includes('upload')) {
      originalImageURL = originalImageURL.replace('/upload', '/upload/w_400,h_300,c_fill');
    }

    res.render("listings/edit.ejs", { listing, originalImageURL });
  } catch (e) {
    console.error("Error rendering edit form:", e);
    req.flash("error", "Cannot load edit form!");
    res.redirect("/listings");
  }
};

// Update a listing
module.exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      { ...req.body.listing },
      { runValidators: true, new: true }
    );

    if (!updatedListing) {
      req.flash('error', 'Listing not found!');
      return res.redirect('/listings');
    }

    // Update image if uploaded
    if (req.file?.path) {
      updatedListing.image = { url: req.file.path, filename: req.file.filename };
      await updatedListing.save();
    }

    req.flash('success', 'Successfully updated listing!');
    res.redirect(`/listings/${id}`);
  } catch (e) {
    console.error("Error updating listing:", e);
    req.flash("error", e.message || "Update failed!");
    res.redirect(`/listings/${req.params.id}/edit`);
  }
};

// Delete a listing
module.exports.delete = async (req, res) => {
  try {
    await Listing.findByIdAndDelete(req.params.id);
    req.flash('success', 'Successfully deleted listing!');
  } catch (e) {
    console.error("Error deleting listing:", e);
    req.flash('error', 'Failed to delete listing!');
  }
  res.redirect("/listings");
};
