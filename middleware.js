module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl; // Store the url they were requesting
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }   
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {  // 👈 renamed here
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};
