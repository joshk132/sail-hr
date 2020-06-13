// Middleware
var isUnauthenticated = require('../middleware/auth').isUnauthenticated,
    isAuthenticated = require('../middleware/auth').isAuthenticated,
    profileImage = require("../middleware/profileImage").profileImage;


// Packages
var aws = require("aws-sdk"),
    multer = require("multer"),
    multerS3 = require('multer-s3');
// Config
var config = require('../config/config');
// AWS config
aws.config.update({
   secretAccessKey: config.aws_s3.secretAccessKey,
   accessKeyId: config.aws_s3.accessKeyId,
   region: config.aws_s3.region,
  sslEnabled: true
});

var s3 = new aws.S3();
var logoBucket = new aws.S3( { params: {Bucket: config.aws_s3.logoBucket} } )


var upload = multer({
        storage: multerS3({
            s3: s3,
            bucket: config.aws_s3.logoBucket,
            key: function (req, file, cb) {
              cb(null, Date.now().toString());
            }
        })
    });

module.exports = function(app, passport) {

	// GET INDEX
	app.get('/', 
	isAuthenticated,
	profileImage,
	(req, res) => {
		res.render('index', {header: 'DASHBOARD'}); 
	});
	
	// GET TEST
	app.get('/test',
	isAuthenticated,
	profileImage,
	(req, res) => {
		var urlParams = {Bucket: config.aws_s3.logoBucket, Key: '1537581218707'};
	    s3.getSignedUrl('getObject', urlParams, function(err, url){
	        if (err) console.log(err);
	        res.render('test/test', {header: 'TEST', url: url});
		});
		
	});
	
	// POST TEST
	app.post('/test', (req, res) => {
		console.log(req.body.hrRole);
	});
	
	// GET BLANK
	app.get('/blank',
	isAuthenticated,
	profileImage,
	(req, res) => {
		res.render('test/blank', {header: 'BLANK'});	
	});
	
	
	
};