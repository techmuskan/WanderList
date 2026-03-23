const express = require('express');
const router = express.Router();
const User = require('../models/user');   // Capitalized
const wrapAsync = require('../utils/wrapAsync');
const passport = require('passport');
const { saveRedirectUrl, isLoggedIn } = require('../middleware');
const userController = require('../controllers/users');

//Home Route
router.get('/', userController.homePage);
router.get('/contact', (req, res) => res.render('users/contact'));

// Dashboard API
router.get('/dashboard/data', wrapAsync(userController.dashboardData));
router.get('/api/pexels', wrapAsync(userController.pexelsImage));
router.post('/dashboard/pins', isLoggedIn, wrapAsync(userController.addPin));
router.delete('/dashboard/pins/:id', isLoggedIn, wrapAsync(userController.removePin));
router.post('/dashboard/checklist', isLoggedIn, wrapAsync(userController.updateChecklist));

// Profile
router.get('/profile', isLoggedIn, wrapAsync(userController.profilePage));

router.route("/signup")
.get(userController.userRegister)  // Register Route
.post(wrapAsync(userController.userSignUp));  // Signup Logic

router.route("/login")
.get(userController.userLogin) //Login Route
.post(saveRedirectUrl, (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            const msg = info?.message || 'Invalid username/email or password.';
            console.log('Login failed for identifier:', req.body?.identifier, '|', msg);
            req.flash('error', msg);
            return res.redirect('/login');
        }
        req.logIn(user, (err) => {
            if (err) return next(err);
            return userController.userLoginLogic(req, res);
        });
    })(req, res, next);
}); //Login logic route

// Forgot / Reset Password
router.get('/forgot', userController.forgotPasswordForm);
router.post('/forgot', wrapAsync(userController.handleForgotPassword));
router.get('/reset/:token', wrapAsync(userController.resetPasswordForm));
router.post('/reset/:token', wrapAsync(userController.handleResetPassword));
router.get('/reset-otp', userController.resetOtpForm);
router.post('/reset-otp', wrapAsync(userController.handleResetOtp));
router.post('/resend-otp', wrapAsync(userController.handleResendOtp));

// Logout Route
router.get('/logout', userController.userLogout);

module.exports = router;
