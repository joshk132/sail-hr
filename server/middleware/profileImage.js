// Packages
var aws = require("aws-sdk");


// Config
var config = require('../config/config');

aws.config.update({
    secretAccessKey: config.aws_s3.secretAccessKey,
    accessKeyId: config.aws_s3.accessKeyId,
    region: config.aws_s3.region,
    sslEnabled: true
});
var s3 = new aws.S3();

exports.profileImage = (req, res, next) => {
    var profileImageDB = req.user.avatar;
    var urlParams = {Bucket: config.aws_s3.logoBucket, Key: profileImageDB};
    s3.getSignedUrl('getObject', urlParams, function(err, url){
    	if (err) console.log(err);
    	res.locals.url = url;
        next();
    });
};
exports.profileImageDelete = (req, res, next) => {
    var profileImageDB = req.user.avatar;
    if (profileImageDB != 'default_profile_image.png') {
        var params = {Bucket: config.aws_s3.logoBucket, Key: profileImageDB};
    s3.deleteObject(params, function(err, data) {
       if (err){
           console.log(err, err.stack); // an error occurred
       } else {
           req.user.avatar = '';
           next();
       }
    });
    }
};

