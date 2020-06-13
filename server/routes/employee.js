var isUnauthenticated = require('../middleware/auth').isUnauthenticated,
    isAuthenticated = require('../middleware/auth').isAuthenticated,
    profileImage = require("../middleware/profileImage").profileImage;

module.exports = function(app, passport) {

    app.get('/profile', 
	isAuthenticated,
	profileImage,
	(req, res) => {
		res.render('user/profile', {header: 'PROFILE'});
	});
	
	app.get('/dashboard', 
	isAuthenticated,
	profileImage,
	(req, res) => {
		res.render('user/dashboard', {header: 'DASHBOARD'});
	});
	
	app.get('/user/settings', 
	isAuthenticated, 
	profileImage,
	(req, res) => {
		res.render('user/settings/settingsIndex', {header: 'SETTINGS'});
	});
	
};