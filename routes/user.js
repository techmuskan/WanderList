const express = require('express');
const router = express.Router();
const User = require('../models/user');   // Capitalized
const wrapAsync = require('../utils/wrapAsync');
const passport = require('passport');
const { saveRedirectUrl } = require('../middleware');

// Register Route
router.get('/signup', (req, res) => {
    res.render('users/signup');
});

// Signup Logic
router.post('/signup', wrapAsync(async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new User({ username, email });
        const registeredUser = await User.register(newUser, password);
        console.log(registeredUser);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to WanderList!');
            res.redirect(res.locals.redirectUrl || '/listings');
        });
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/signup');
    }
}));

// Login Route
router.get('/login', (req, res) => {
    res.render('users/login');
});

// Login Logic
router.post(
    '/login',
    saveRedirectUrl,
    passport.authenticate('local', {
        failureRedirect: '/login',
        failureFlash: true
    }),
    (req, res) => {
        req.flash('success', 'Welcome back to Wanderlist!');
        res.redirect(res.locals.redirectUrl || '/listings');
    }
);

// Logout Route
router.get('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        req.flash('success', 'Goodbye!');
        res.redirect('/listings');
    });
});

module.exports = router;
