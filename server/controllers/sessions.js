var passport = require('passport');


exports.postLogin = (req, res, next) => {
    passport.authenticate('login', {
		successRedirect : '/',
		failureRedirect : '/login', 
		failureFlash : true 
	})(req, res, next);
};

exports.postSignup = (req, res, next) => {
	passport.authenticate('signup', {
		successRedirect : '/company/profile', 
		failureRedirect : '/signup', 
		failureFlash : true 
	})(req, res, next);
};

exports.postSignupSub = (req, res, next) => {
	passport.authenticate('signup-sub', {
		successRedirect : '/', 
		failureRedirect : '/user/create', 
		failureFlash : true,
		session: false // prevent auto-login
	})(req, res, next);
};
