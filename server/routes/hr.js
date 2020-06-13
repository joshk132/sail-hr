// Middleware
var isUnauthenticated = require('../middleware/auth').isUnauthenticated,
    isAuthenticated = require('../middleware/auth').isAuthenticated,
    isCompany = require('../middleware/auth').isCompany,
    profileImage = require("../middleware/profileImage").profileImage,
    noPlanLimiter = require('../middleware/planLimiter').noPlanLimiter;
    
// Models
var User = require("../models/user");

module.exports = function(app, passport) {

	// GET USER/CREATE  // revisit this once more data has been added.
    app.get('/user/create', 
	isAuthenticated,
	isCompany,
	noPlanLimiter,
	profileImage,
	(req, res) => {
		User.find({companyID: req.user.companyID, role: "manager" }, function(err, allManagers){
           if(err){
               console.log(err);
           } else {
           	var managers = allManagers;
             res.render('hr/newUser', {header: 'NEW USER', managers: managers});
           }
        });
	});
	
	// GET USERS
	app.get('/users',
	isAuthenticated,
	isCompany,
	profileImage,
	(req, res) => {
		let queries = [
			User.find({"companyID":req.user.companyID}, (err, foundUsers) => {
				if(err) {
					req.flash('error', 'Could not find all users');
				}
			})
		];
		Promise.all(queries)
		.then(results => (results.map(result => (result.slice(1)))))
		.then(adaptedResults => res.render('hr/users', { header: 'EMPLOYEES', users: adaptedResults[0] })
		).catch( err => {
			req.flash('error', err);
			res.render('hr/users', {header: 'USERS'});
		});
			
	});
	
};