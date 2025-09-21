const User = require('../models/user'); // ✅ Correct

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
        res.redirect('/listings');
    });
};