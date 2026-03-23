const Listing = require('../models/listing');  
const User = require('../models/user');
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
  try {
    const { q, category, sort } = req.query; 
    let filter = {};

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } }
      ];
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    let query = Listing.find(filter);
    if (sort === "price_asc") query = query.sort({ price: 1 });
    if (sort === "price_desc") query = query.sort({ price: -1 });
    if (sort === "newest") query = query.sort({ createdAt: -1 });
    const allListings = await query;
    let pinnedIds = [];
    if (req.user) {
      const user = await User.findById(req.user._id).select('pinnedListings').lean();
      pinnedIds = (user?.pinnedListings || []).map(id => id.toString());
    }
    res.render("listings/index", {
      allListings,
      currentUser: req.user,
      searchQuery: q || "",
      selectedCategory: category || "All",
      selectedSort: sort || "",
      pinnedIds
    });
  } catch (err) {
    console.log(err);
    res.redirect("/listings");
  }
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

    // Normalize GST rate from percent to decimal
    if (req.body?.listing?.gstRate) {
      const pct = Number(req.body.listing.gstRate);
      req.body.listing.gstRate = isNaN(pct) ? 0.18 : Math.max(0, Math.min(1, pct / 100));
    }
    // Create listing with defaults and geometry
    const listing = new Listing({
      ...req.body.listing,
      owner: req.user._id,
      geometry
    });

    // Image handling
    const imageUrl = req.body?.listing?.imageUrl?.trim();
    const fileUrl = req.file?.path || req.file?.secure_url || req.file?.url;
    const fileName = req.file?.filename || req.file?.public_id || "upload";
    if (fileUrl) {
      listing.image = { url: fileUrl, filename: fileName };
    } else if (imageUrl) {
      listing.image = { url: imageUrl, filename: "external" };
    } else {
      console.warn("⚠️  No image uploaded or URL provided for listing:", listing.title);
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

    if (req.body?.listing?.gstRate) {
      const pct = Number(req.body.listing.gstRate);
      req.body.listing.gstRate = isNaN(pct) ? 0.18 : Math.max(0, Math.min(1, pct / 100));
    }
    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      { ...req.body.listing },
      { runValidators: true, new: true }
    );

    if (!updatedListing) {
      req.flash('error', 'Listing not found!');
      return res.redirect('/listings');
    }

    // Update image if uploaded or URL provided
    const imageUrl = req.body?.listing?.imageUrl?.trim();
    const fileUrl = req.file?.path || req.file?.secure_url || req.file?.url;
    const fileName = req.file?.filename || req.file?.public_id || "upload";
    const hasFile = Boolean(fileUrl);
    const hasUrl = Boolean(imageUrl);
    console.log("Image update:", { id, hasFile, hasUrl, imageUrl: imageUrl || null, fileUrl: fileUrl || null });

    if (hasFile) {
      updatedListing.image = { url: fileUrl, filename: fileName };
      await updatedListing.save();
    } else if (hasUrl) {
      updatedListing.image = { url: imageUrl, filename: "external" };
      await updatedListing.save();
    } else {
      console.warn("⚠️  No image update provided for listing:", updatedListing.title);
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
