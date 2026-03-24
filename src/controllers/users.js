const User = require('../models/user'); // ✅ Correct
const Listing = require('../models/listing');
const Review = require('../models/review');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const categoryVibeMap = {
    "Beachfront": { vibe: "coastal", tag: "Coastal" },
    "Arctic Pools": { vibe: "wild", tag: "Arctic" },
    "Mountains": { vibe: "mountain", tag: "Mountain" },
    "Iconic Cities": { vibe: "city", tag: "City" },
    "Castles": { vibe: "heritage", tag: "Heritage" },
    "Farms": { vibe: "heritage", tag: "Countryside" },
    "Camping": { vibe: "wild", tag: "Camping" },
    "Snow": { vibe: "mountain", tag: "Snow" },
    "Tiny Homes": { vibe: "coastal", tag: "Tiny Home" },
    "Rooms": { vibe: "city", tag: "Stay" },
    "Desserts": { vibe: "city", tag: "Food" },
    "Trending": { vibe: "all", tag: "Trending" }
};

const formatListingForDashboard = (listing) => {
    const mapping = categoryVibeMap[listing.category] || { vibe: "all", tag: listing.category || "Trending" };
    return {
        id: listing._id,
        name: listing.title,
        country: listing.country || "Country not specified",
        location: listing.location || "Location not specified",
        vibe: mapping.vibe,
        tag: mapping.tag,
        season: listing.location || "Explorer favorite",
        imageUrl: listing.image?.url || "/images/default.jpg"
    };
};

const buildTripLab = (listings) => {
    const byVibe = {
        coastal: [],
        mountain: [],
        city: [],
        heritage: [],
        wild: []
    };
    listings.forEach(listing => {
        const mapping = categoryVibeMap[listing.category] || { vibe: "city" };
        const vibe = mapping.vibe in byVibe ? mapping.vibe : "city";
        byVibe[vibe].push(listing);
    });
    const toSteps = (arr) => {
        const picks = arr.slice(0, 3);
        return [
            picks[0] ? `Arrive in ${picks[0].location} and check in at ${picks[0].title}` : "Arrival and local stroll",
            picks[1] ? `Signature moment near ${picks[1].location}` : "Signature experience",
            picks[2] ? `Slow evening in ${picks[2].location}` : "Farewell moments"
        ];
    };
    return {
        coastal: toSteps(byVibe.coastal),
        mountain: toSteps(byVibe.mountain),
        city: toSteps(byVibe.city),
        heritage: toSteps(byVibe.heritage),
        wild: toSteps(byVibe.wild)
    };
};

// Home Page
module.exports.homePage = (req, res) => {
    res.render('users/home');
};

module.exports.userRegister = (req, res) => {
    res.render('users/signup');
};

module.exports.userSignUp = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        if (!password || password.length < 8) {
            req.flash('error', 'Password must be at least 8 characters.');
            return res.redirect('/signup');
        }
        if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^\w\s]/.test(password)) {
            req.flash('error', 'Password must include uppercase, lowercase, number, and special character.');
            return res.redirect('/signup');
        }
        const newUser = new User({ username, email });
        const registeredUser = await User.register(newUser, password);

        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to WanderList!');
            res.redirect(res.locals.redirectUrl || '/listings');
        });
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/signup');
    }
};

module.exports.userLogin = (req, res) => {
    res.render('users/login');
};

module.exports.userLoginLogic = (req, res) => {
    req.flash('success', 'Welcome back to Wanderlist!');
    res.redirect(res.locals.redirectUrl || '/listings');
};

module.exports.userLogout = (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        req.flash('success', 'Goodbye!');
        res.redirect('/');
    });
};

module.exports.dashboardData = async (req, res) => {
    const listings = await Listing.find({})
        .sort({ createdAt: -1 })
        .limit(24)
        .lean();

    const destinations = listings.map(formatListingForDashboard);
    const tripLab = buildTripLab(listings);

    const [listingCount, reviewCount, userCount] = await Promise.all([
        Listing.countDocuments(),
        Review.countDocuments(),
        User.countDocuments()
    ]);

    let pins = [];
    let checklist = {};

    if (req.user) {
        const user = await User.findById(req.user._id)
            .populate('pinnedListings', 'title country location category')
            .lean();
        const userPins = user?.pinnedListings || [];
        pins = userPins.map(formatListingForDashboard);
        if (user?.checklist) {
            checklist = user.checklist instanceof Map
                ? Object.fromEntries(user.checklist)
                : user.checklist;
        }
    }

    res.json({
        destinations,
        pins,
        checklist,
        tripLab,
        metrics: {
            listings: listingCount,
            reviews: reviewCount,
            users: userCount
        }
    });
};

module.exports.profilePage = async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate('pinnedListings')
        .lean();
    const myListings = await Listing.find({ owner: req.user._id }).lean();
    res.render('users/profile', { user, myListings });
};

module.exports.updateProfile = async (req, res) => {
    const { username, email } = req.body;
    const nextUsername = (username || "").trim();
    const nextEmail = (email || "").trim().toLowerCase();

    if (!nextUsername || nextUsername.length < 3) {
        req.flash('error', 'Username must be at least 3 characters.');
        return res.redirect('/profile');
    }
    if (!nextEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
        req.flash('error', 'Please enter a valid email address.');
        return res.redirect('/profile');
    }

    const usernameTaken = await User.findOne({ username: nextUsername, _id: { $ne: req.user._id } }).lean();
    if (usernameTaken) {
        req.flash('error', 'That username is already taken.');
        return res.redirect('/profile');
    }
    const emailTaken = await User.findOne({ email: nextEmail, _id: { $ne: req.user._id } }).lean();
    if (emailTaken) {
        req.flash('error', 'That email is already in use.');
        return res.redirect('/profile');
    }

    await User.findByIdAndUpdate(req.user._id, {
        username: nextUsername,
        email: nextEmail
    });

    req.flash('success', 'Profile updated.');
    res.redirect('/profile');
};

module.exports.addPin = async (req, res) => {
    const { listingId } = req.body;
    if (!listingId) return res.status(400).json({ error: "listingId is required" });

    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    const user = await User.findById(req.user._id);
    const alreadyPinned = user.pinnedListings.some(id => id.equals(listing._id));
    if (!alreadyPinned) {
        user.pinnedListings.push(listing._id);
        await user.save();
    }
    res.json({ ok: true, pin: formatListingForDashboard(listing) });
};

module.exports.removePin = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    user.pinnedListings = user.pinnedListings.filter(pinId => !pinId.equals(id));
    await user.save();
    res.json({ ok: true });
};

module.exports.updateChecklist = async (req, res) => {
    const { item, checked } = req.body;
    if (!item) return res.status(400).json({ error: "item is required" });

    const user = await User.findById(req.user._id);
    user.checklist.set(item, Boolean(checked));
    await user.save();
    res.json({ ok: true });
};

module.exports.forgotPasswordForm = (req, res) => {
    res.render('users/forgot');
};

module.exports.handleForgotPassword = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        req.flash('error', 'No account found for that email.');
        return res.redirect('/forgot');
    }

    if (user.resetPasswordOtpLastSent && Date.now() - user.resetPasswordOtpLastSent.getTime() < 60 * 1000) {
        req.flash('error', 'Please wait 60 seconds before requesting a new OTP.');
        return res.redirect('/reset-otp');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = Date.now() + 2 * 60 * 1000; // 2 min
    user.resetPasswordOtpLastSent = new Date();
    await user.save();
    req.session.otpSentAt = Date.now();
    req.session.otpExpiresAt = user.resetPasswordOtpExpires.getTime();

    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpFrom = process.env.SMTP_FROM || 'no-reply@wanderlist.local';

    if (smtpHost && smtpUser && smtpPass) {
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: smtpPass }
        });
        await transporter.sendMail({
            to: email,
            from: smtpFrom,
            subject: 'WanderList Password Reset OTP',
            text: `Your OTP is: ${otp} (valid 2 min)`
        });
        req.flash('success', 'OTP sent to your email.');
    } else {
        console.log('Password reset OTP (SMTP not configured):', otp);
        req.flash('success', 'OTP generated. Check server console.');
    }
    res.redirect('/reset-otp');
};

module.exports.resetPasswordForm = async (req, res) => {
    const { token } = req.params;
    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
        req.flash('error', 'Reset link is invalid or expired.');
        return res.redirect('/forgot');
    }
    res.render('users/reset', { token });
};

module.exports.handleResetPassword = async (req, res) => {
    const { token } = req.params;
    const { password, confirm } = req.body;
    if (!password || password.length < 8) {
        req.flash('error', 'Password must be at least 8 characters.');
        return res.redirect(`/reset/${token}`);
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^\w\s]/.test(password)) {
        req.flash('error', 'Password must include uppercase, lowercase, number, and special character.');
        return res.redirect(`/reset/${token}`);
    }
    if (password !== confirm) {
        req.flash('error', 'Passwords do not match.');
        return res.redirect(`/reset/${token}`);
    }
    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
        req.flash('error', 'Reset link is invalid or expired.');
        return res.redirect('/forgot');
    }
    // Prevent reusing old password
    const isSame = await new Promise((resolve) => {
        user.authenticate(password, (err, _user, passwordErr) => {
            if (err) return resolve(false);
            resolve(!passwordErr);
        });
    });
    if (isSame) {
        req.flash('error', 'New password cannot be same as old password.');
        return res.redirect(`/reset/${token}`);
    }
    await user.setPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    await user.save();
    req.flash('success', 'Password updated. Please login.');
    res.redirect('/login');
};

module.exports.resetOtpForm = (req, res) => {
    res.render('users/reset-otp', {
        otpSentAt: req.session.otpSentAt || null,
        otpExpiresAt: req.session.otpExpiresAt || null
    });
};

module.exports.handleResetOtp = async (req, res) => {
    const { email, otp, password, confirm } = req.body;
    if (!password || password.length < 8) {
        req.flash('error', 'Password must be at least 8 characters.');
        return res.redirect('/reset-otp');
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^\w\s]/.test(password)) {
        req.flash('error', 'Password must include uppercase, lowercase, number, and special character.');
        return res.redirect('/reset-otp');
    }
    if (password !== confirm) {
        req.flash('error', 'Passwords do not match.');
        return res.redirect('/reset-otp');
    }
    const user = await User.findOne({ email });
    if (!user) {
        req.flash('error', 'No account found for that email.');
        return res.redirect('/reset-otp');
    }
    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpires || user.resetPasswordOtpExpires.getTime() < Date.now()) {
        req.flash('error', 'OTP expired. Please resend.');
        return res.redirect('/reset-otp');
    }
    if (user.resetPasswordOtp !== otp) {
        req.flash('error', 'OTP invalid. Please try again.');
        return res.redirect('/reset-otp');
    }
    // Prevent reusing old password
    const isSameOtp = await new Promise((resolve) => {
        user.authenticate(password, (err, _user, passwordErr) => {
            if (err) return resolve(false);
            resolve(!passwordErr);
        });
    });
    if (isSameOtp) {
        req.flash('error', 'New password cannot be same as old password.');
        return res.redirect('/reset-otp');
    }
    await user.setPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    user.resetPasswordOtpLastSent = undefined;
    await user.save();
    req.flash('success', 'Password updated. Please login.');
    res.redirect('/login');
};

module.exports.handleResendOtp = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        req.flash('error', 'No account found for that email.');
        return res.redirect('/reset-otp');
    }
    if (user.resetPasswordOtpLastSent && Date.now() - user.resetPasswordOtpLastSent.getTime() < 60 * 1000) {
        req.flash('error', 'Please wait 60 seconds before requesting a new OTP.');
        return res.redirect('/reset-otp');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = Date.now() + 2 * 60 * 1000; // 2 min
    user.resetPasswordOtpLastSent = new Date();
    await user.save();
    req.session.otpSentAt = Date.now();
    req.session.otpExpiresAt = user.resetPasswordOtpExpires.getTime();

    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpFrom = process.env.SMTP_FROM || 'no-reply@wanderlist.local';

    if (smtpHost && smtpUser && smtpPass) {
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: smtpPass }
        });
        await transporter.sendMail({
            to: email,
            from: smtpFrom,
            subject: 'WanderList Password Reset OTP',
            text: `Your OTP is: ${otp} (valid 2 min)`
        });
        req.flash('success', 'OTP resent to your email.');
    } else {
        console.log('Password reset OTP (SMTP not configured):', otp);
        req.flash('success', 'OTP regenerated. Check server console.');
    }
    res.redirect('/reset-otp');
};

module.exports.pexelsImage = async (req, res) => {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
        return res.status(501).json({ error: 'PEXELS_API_KEY not configured' });
    }
    const q = (req.query.q || '').toString().trim();
    if (!q) return res.status(400).json({ error: 'query required' });

    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=1&orientation=landscape`;
    const response = await fetch(url, {
        headers: { Authorization: apiKey }
    });
    if (!response.ok) {
        return res.status(response.status).json({ error: 'pexels_error' });
    }
    const data = await response.json();
    const photo = data?.photos?.[0];
    if (!photo) return res.status(404).json({ error: 'no_image' });
    res.json({
        url: photo.src?.large || photo.src?.original,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url
    });
};
