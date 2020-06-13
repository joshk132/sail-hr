// Middleware
var isUnauthenticated = require('../middleware/auth').isUnauthenticated,
    isAuthenticated = require('../middleware/auth').isAuthenticated,
    noPlanLimiter = require('../middleware/planLimiter').noPlanLimiter;
    
// Models
var User    = require('../models/user'),
	Token   = require("../models/token");
	
// Controllers
var sessions = require('../controllers/sessions'),
	users = require('../controllers/users'),
	company = require('../controllers/company');

module.exports = function(app, passport) {

	// GET LOGIN
	app.get('/login', 
	function(req, res) {
		res.render('auth/login');
	});

	// POST LOGIN
	app.post('/user/login',
	isUnauthenticated,
	sessions.postLogin);
	
	// GET SIGNUP
	app.get('/signup',
	function(req, res) {
		res.render('auth/signup');
	});

	// POST SIGNUP
	app.post('/user/signup', 
	isUnauthenticated,
	sessions.postSignup);

	// GET LOGOUT
	app.get('/logout', 
	(req, res) => {
		req.logout();
		req.flash('success', 'Successfully logged you out.');
		res.redirect('/login');
	});
	
	// GET CONFIRMATION
	app.get('/user/confirmation/:token/:email', 
	(req, res) => {
		res.locals.token = req.params.token;
    	res.locals.email = req.params.email;
    	res.render('auth/confirmation');
	});
	
	// POST CONFIRMATION	
	app.post('/user/confirmation', 
	users.confirmAccount);

	// GET RESET
	app.get('/reset/:token',
	isUnauthenticated,
	(req, res) => {
		res.locals.token = req.params.token;
		res.render('auth/reset');
	},
	users.getToken);

	// POST RESET
	app.post('/user/reset/:token',
	isUnauthenticated,
	users.postToken);
	
	// POST DELETE
	app.post('/user/delete', 
	isAuthenticated, 
	users.deleteAccount);
	
	// GET FORGOT
	app.get('/forgot', 
	isUnauthenticated,
	(req, res) => {
		res.render('auth/forgot');
	});

	// POST FORGOT
	app.post('/user/forgot', 
	isUnauthenticated,
	users.postForgotPassword);
	
	//=====================
	// ROUTES FOR SUB USERS
	//=====================
	
	// POST USER/NEW
	app.post('/user/new', 
	isAuthenticated,
	noPlanLimiter,
	company.postNewUserPlan,
	sessions.postSignupSub);
	
	//POST USER/DELETE
	app.post('/user/delete/:id',
	isAuthenticated,
	company.postDeleteUserPlan,
	users.subUserDeleteAccount);
};
