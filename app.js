const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Listing = require('./models/listing');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const wrapAsync = require('./utils/wrapAsync.js');
const ExpressError = require('./utils/ExpressError.js');
const { listingSchema, reviewSchema } = require("./schema.js")
const Review = require('./models/review');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(methodOverride('_method'));
app.engine('ejs', ejsMate);

const listings = require('./routes/listing');
app.use('/', listings);

async function main() {
    await mongoose.connect('mongodb://localhost:27017/WanderList');
    console.log('Connected to MongoDB');
}

main().then(() => {
console.log('MongoDB connected');
}).catch((err) => {
    console.error(err);
});

app.get('/', (req, res) => {
    res.send("Hello I'm a server");
});

// app.get("/testListing", async(req, res) => {
//     const listing = new Listing({
//         title: "Test Listing",
//         description: "This is a test listing",
//         price: 100,
//         location: "Test Location",
//         country: "Test Country",
//     });
//     await listing.save().then(() => {
//         console.log("Listing saved");
//         res.send("Listing saved");
//     }).catch((err) => {
//         res.status(500).send("Error saving listing");
//     });
// });

const validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);
    if (error) {
        const msg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};

const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);   // use reviewSchema here
    if (error) {
        const errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(errMsg, 400);   // ✅ message first, status second
    } else {
        next();
    }
};



  
  



// Reviews
// Post Route for Reviews
app.post("/listings/:id/reviews", validateReview, wrapAsync (async(req,res)=>{
    const listing = await Listing.findById(req.params.id);
    const newReview = new Review(req.body.review);
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    res.redirect(`/listings/${listing._id}`);  
})
);
// Delete Route for Reviews
app.delete("/listings/:id/reviews/:reviewId", wrapAsync(async(req, res) => {
    const { id, reviewId } = req.params;    
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/listings/${id}`);
}));    




app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

app.use((err, req, res, next) => {  
    let {statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render('listings/error.ejs', { err });
});



app.listen(8080, () => {
    console.log('Server started');
}); 
 