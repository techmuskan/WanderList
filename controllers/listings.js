const Listing = require('../models/listing');  // singular, matches the file


module.exports.index = async (req, res) => {
    const allListings = await Listing.find({}).populate('owner');
    res.render("listings/index.ejs", { allListings });
    
};

module.exports.newFormRender = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.show = async (req, res) => {
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
};

module.exports.create = async (req, res) => {
    try {
        // Check if listing exists in body
        if (!req.body.listing) throw new Error("Listing data missing!");

        const listing = new Listing(req.body.listing); // title, desc, price, location, country

        // If image is uploaded
        if (req.file) {
            listing.image = {
                url: req.file.path,       // or req.file.path/cloudinary url
                filename: req.file.filename
            };
        }

        listing.owner = req.user._id;   // if using login

        await listing.save();
        req.flash('success', 'Listing created successfully!');
        res.redirect(`/listings`);
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/listings/new');
    }
};

module.exports.edit = async (req, res) => {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
        req.flash('error', 'Listing not found!');
        return res.redirect('/listings');
    }

    // Cloudinary resize transformation for edit page
    let originalImageURL = null;
    if (listing.image && listing.image.url) {
        // Resize via Cloudinary: width 400px, auto height, keep quality
        // Add other transformations if needed (e.g., quality, format)
        originalImageURL = listing.image.url.replace(
            '/upload',
            '/upload/w_250,h_300'
        );
    }

    res.render("listings/edit.ejs", { listing, originalImageURL });
};

module.exports.update = async (req, res) => {
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

    if (req.file) {
        const { path: url, filename } = req.file;
        updatedListing.image = { url, filename };  // replace old image
        await updatedListing.save();
    }

    req.flash('success', 'Successfully updated listing!');
    res.redirect(`/listings/${id}`);
};


module.exports.delete = async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted listing!');
    res.redirect("/listings");
}