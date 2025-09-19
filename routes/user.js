const express = require('express');
const router = express.Router();
const User = require('../models/user');   // Capitalized
const wrapAsync = require('../utils/wrapAsync');
const passport = require('passport');
const { saveRedirectUrl } = require('../middleware');
const userController = require('../controllers/users');

// Register Route
router.get('/signup', userController.userRegister);

// Signup Logic
router.post('/signup', wrapAsync(userController.userSignUp));

// Login Route
router.get('/login', userController.userLogin);

// Login Logic
router.post(
    '/login',
    saveRedirectUrl,
    passport.authenticate('local', {
        failureRedirect: '/login',
        failureFlash: true
    }),
    userController.userLoginLogic
);

// Logout Route
router.get('/logout', userController.userLogout);

module.exports = router;
