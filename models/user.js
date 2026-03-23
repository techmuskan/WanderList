const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({ 
    email: {
        type: String,
        required: true,
        unique: true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    resetPasswordOtp: String,
    resetPasswordOtpExpires: Date,
    resetPasswordOtpLastSent: Date,
    pinnedListings: [
        { type: Schema.Types.ObjectId, ref: 'Listing' }
    ],
    checklist: {
        type: Map,
        of: Boolean,
        default: {}
    }
});

UserSchema.plugin(passportLocalMongoose); // adds username, hash, salt

module.exports = mongoose.model('User', UserSchema); // ✅ export model
