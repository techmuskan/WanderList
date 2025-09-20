const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review');

const listingSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: "No description provided" },
  image: {
    url: { type: String, default: "/images/default.jpg" },
    filename: { type: String, default: "default" }
  },
  price: { type: Number, required: true, default: 0 },
  location: { type: String, default: "Location not specified" },
  country: { type: String, default: "Country not specified" },
  reviews: [
    { type: Schema.Types.ObjectId, ref: 'Review' }
  ],
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  geometry: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      default: [77.4126, 23.2699] // fallback coordinates
    }
  }
}, { timestamps: true }); // automatically adds createdAt and updatedAt

// 2dsphere index for geoqueries
listingSchema.index({ geometry: "2dsphere" });

// Cascade delete reviews when a listing is deleted
listingSchema.post('findOneAndDelete', async (listing) => {
  try {
    if (listing?.reviews?.length > 0) {
      await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
  } catch (err) {
    console.error("Error deleting reviews for listing:", err);
  }
});

const Listing = mongoose.model('Listing', listingSchema);
module.exports = Listing;
