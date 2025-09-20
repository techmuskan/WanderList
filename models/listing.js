const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
  category: { type: String, enum: ["Trending", "Rooms", "Iconic Cities", "Mountains", "Castles", "Arctic Pools", "Camping", "Farms", "Snow", "Desserts", "Beachfront", "Tiny Homes"], default: "Trending" },
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
      default: [77.4126, 23.2699]
    }
  }
}, { timestamps: true });


// Indexes
listingSchema.index({ geometry: "2dsphere" });
listingSchema.index({ title: "text", description: "text", location: "text", country: "text" });

// Cascade delete reviews
listingSchema.post('findOneAndDelete', async (listing) => {
  try {
    if (listing?.reviews?.length > 0) {
      await mongoose.model('Review').deleteMany({ _id: { $in: listing.reviews } });
    }
  } catch (err) {
    console.error("Error deleting reviews for listing:", err);
  }
});

module.exports = mongoose.model('Listing', listingSchema);
