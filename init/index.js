const mongoose = require('mongoose');
const initData = require('./data');
const Listing = require('../models/listing');    

async function main() {
    await mongoose.connect('mongodb://localhost:27017/WanderList');
    console.log('Connected to MongoDB');
}

main().then(() => {
    console.log('MongoDB connected');
}).catch((err) => {
    console.error(err);
});

const initDB = async () => {
    await Listing.deleteMany({});
    initData = initData.data.map((obj) => ({...obj, owner: "68c203dca323a0ebdd0663d2"}));
    await Listing.insertMany(initData.data);
    console.log("Data inserted");
} 

initDB().then(() => {
    console.log("Data inserted");
}).catch((err) => {
    console.error(err);
});


initDB();