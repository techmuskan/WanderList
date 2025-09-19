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
        filename: { type: String, default: "https://scontent.fbho6-1.fna.fbcdn.net/v/t39.30808-1/301587566_404399295135504_3234448828154347139_n.jpg?stp=dst-jpg_s200x200_tt6&_nc_cat=103&ccb=1-7&_nc_sid=2d3e12&_nc_ohc=1tIE5PsWfBEQ7kNvwEpm0Cz&_nc_oc=AdnCMIi4pzXBeFyxOOUwcBszpphFjJvCTKTcLPhcOqgEusKNzFFTAOPdIzrYaeeo-6GB_4E6z_4_tXkJem7RoNii&_nc_zt=24&_nc_ht=scontent.fbho6-1.fna&_nc_gid=jSKOJsuIbCBV8fjqHyZ2nw&oh=00_AfZ1E2H4SmTOecMRCHc4SniVJKPL6YzLI04oR_pJj7JqhA&oe=68CC4621" },
        url: {
          type: String,
          default:
            "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGdvYXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
          set: (v) =>
            v === ""
              ? "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGdvYXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60"
              : v,
        },
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