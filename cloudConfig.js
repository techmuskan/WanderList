const cloudinary = require('cloudinary');
const cloudinaryV2 = cloudinary.v2 || cloudinary;

cloudinaryV2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

const legacyStorage = require('multer-storage-cloudinary');
const storage = legacyStorage({
    cloudinary: { v2: cloudinaryV2 },
    folder: 'Wanderlist_DEV',
    allowedFormats: ["png", "jpg", "jpeg", "pdf"]
});

module.exports = {
    cloudinary: cloudinaryV2,
    storage,
}
