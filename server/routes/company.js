// Packages
var aws = require("aws-sdk"),
    multer = require("multer"),
    multerS3 = require('multer-s3');

// Middleware
var isAuthenticated = require('../middleware/auth').isAuthenticated,
    isCompany = require('../middleware/auth').isCompany,
    profileImage = require("../middleware/profileImage").profileImage,
    profileImageDelete = require("../middleware/profileImage").profileImageDelete;

// Models
var User = require("../models/user");

// Controllers
var company = require('../controllers/company');

// Config
var config = require('../config/config');
var StripePubKey = config.stripeOptions.stripePubKey;

aws.config.update({
   secretAccessKey: config.aws_s3.secretAccessKey,
   accessKeyId: config.aws_s3.accessKeyId,
   region: config.aws_s3.region,
  sslEnabled: true
});
var s3 = new aws.S3();

var upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: config.aws_s3.logoBucket,
        key: function (req, file, cb) {
            var name = Date.now().toString();
            User.findById(req.user.id, function(err, user) {
                if (err) console.log(err);
                user.avatar = name;
                user.save();
                cb(null, name);
            });
        }
    })
});


module.exports = function(app, passport) {

    // GET WELCOME
    app.get('/welcome', 
    isAuthenticated,
    isCompany,
    profileImage,
    (req, res) => {
       res.render('company/welcome', {header: 'WELCOME'});
    });
    
    // GET BILLING
    app.get('/company/billing', 
    isAuthenticated,
    isCompany,
    profileImage,
    (req, res) => {
       res.render('company/billing', {header: 'BILLING', key: StripePubKey});
    });
    
    // POST COMPANY BILLING
    app.post('/company/billing',
    isAuthenticated,
    isCompany,
    company.postBilling);
    
    // POST COMPANY PLAN
    app.post('/company/plan',
    isAuthenticated,
    isCompany,
    company.postPlan);
	
    // POST COMPANY PROFILE
    app.post('/company/profile',
    isAuthenticated,
    isCompany,
    company.postProfile);
    
    // GET COMPANY PROFILE
    app.get('/company/profile',
    isAuthenticated,
    isCompany,
    profileImage,
    (req, res) => {
        res.render('company/profile', {header: 'COMPANY PROFILE'});
    });
    
    // POST COMPANY LOGO
    app.post('/company/logo',
    isAuthenticated,
    isCompany,
    profileImageDelete,
    upload.array('file', 1),
    (req, res) => {
       console.log(req.user.avatar)
    });
};
