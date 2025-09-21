const express = require('express');
const router = express.Router();
const User = require('../models/user');   // Capitalized
const wrapAsync = require('../utils/wrapAsync');
const passport = require('passport');
const { saveRedirectUrl } = require('../middleware');
const userController = require('../controllers/users');

//Home Route
router.get('/', userController.homePage);

router.route("/signup")
.get(userController.userRegister)  // Register Route
.post(wrapAsync(userController.userSignUp));  // Signup Logic

router.route("/login")
.get(userController.userLogin) //Login Route
.post(saveRedirectUrl,
    passport.authenticate('local', {
        failureRedirect: '/login',
        failureFlash: true
    }),
    userController.userLoginLogic); //Login logic route

// Logout Route
router.get('/logout', userController.userLogout);

module.exports = router;
