require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../src/models/listing');

const rawAtlasUrl = process.env.ATLASDB_URL || '';
const envDbName = process.env.DB_NAME || '';
const parsedDbName = (() => {
  const match = rawAtlasUrl.match(/\/([^/?]+)(\?|$)/);
  return match ? match[1] : '';
})();
const dbName = envDbName || parsedDbName || 'WanderList';

const dbURL = rawAtlasUrl
  ? rawAtlasUrl
  : 'mongodb://127.0.0.1:27017/WanderList';

const connectOptions = parsedDbName ? {} : { dbName };

(async () => {
  try {
    await mongoose.connect(dbURL, connectOptions);
    const missing = await Listing.find({
      $or: [
        { 'image.url': { $exists: false } },
        { 'image.url': { $in: [null, ''] } }
      ]
    }).select('_id title image').lean();

    if (missing.length === 0) {
      console.log('✅ All listings have image URLs');
    } else {
      console.log(`⚠️  Listings missing image.url: ${missing.length}`);
      missing.forEach(l => {
        console.log(`- ${l._id} | ${l.title} | image: ${JSON.stringify(l.image)}`);
      });
    }
  } catch (err) {
    console.error('Error checking listings:', err);
  } finally {
    await mongoose.disconnect();
  }
})();
