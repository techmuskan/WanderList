const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review');

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: {
        url: String,
        filename: String,
      },
    price: {
      type: Number, required:true, default:0},
    location: String,
    country: String,
    reviews: [
        {
            type: Schema.Types.ObjectId,  
            ref: 'Review',
        },
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
});

listingSchema.post('findOneAndDelete', async (listing) => {
    if(listing) {
        await Review.deleteMany({ 
          _id : {
            $in: listing.reviews
          }
        });
    } 
});

const Listing = mongoose.model('Listing', listingSchema);
module.exports = Listing;
// This code defines a Mongoose schema for a listing, and exports the model.