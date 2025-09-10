const express = require('express');
const router = express.Router();
const user = require('../models/user');
const wrapAsync = require('../utils/wrapAsync');
const passport = require('passport');


// Register Route
router.get('/signup', (req, res) => {
    res.render('users/signup');
});

// Signup Logic
router.post('/signup', wrapAsync(async (req, res) => {
    try{
    const {username, email, password} = req.body;
    const newUser = new user({username, email});
    const registeredUser = await user.register(newUser, password);
    console.log(registeredUser);
    req.flash('success', 'Welcome to WanderList!');
    res.redirect('/listings');
    } catch(e) {
    req.flash('error', e.message);
    res.redirect('/signup');
}})
);

// Login Route
router.get('/login', (req, res) => {
    res.render('users/login');
});

// Login Logic
router.post(
    '/login', 
    passport.authenticate(
        'local', 
        {
            failureRedirect: '/login',
            failureFlash: true
        }
    ),
    async (req, res) => {   
        req.flash('success', 'Welcome back!');
        res.redirect('/listings');
    }
);

// Logout Route
router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        req.flash('success', "Goodbye!");
        res.redirect('/listings');
    });
});

module.exports = router;