const mongoose = require('mongoose');
const initData = require('./data');
const Listing = require('../models/listing');

async function main() {
  try {
    await mongoose.connect('mongodb://localhost:27017/WanderList');
    console.log('Connected to MongoDB');

    // Clear previous listings
    await Listing.deleteMany({});
    console.log('Cleared existing listings');

    // Owner ID (make sure this user exists in your DB)
    const ownerId = new mongoose.Types.ObjectId('68c203dca323a0ebdd0663d2');

    // Add owner to all listings
    const listingsWithOwner = initData.data.map(listing => ({
      ...listing,
      owner: ownerId
    }));

    const inserted = await Listing.insertMany(listingsWithOwner);
    console.log(`Inserted ${inserted.length} listings with owner ID ${ownerId}`);

  } catch (err) {
    console.error('Error seeding listings:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

main();
