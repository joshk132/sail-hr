// Models
var User = require('../models/user');
var Token = require('../models/token');

// Packages
var nodemailer = require('nodemailer');
var mailgunApiTransport = require('nodemailer-mailgunapi-transport');
var crypto = require('crypto');
var async = require('async');

// Utils
var sendEmail = require("../utils/sendEmail");


exports.deleteAccount = function(req, res, next){
  User.findById(req.user.id, function(err, user) {
    if (err) return next(err);

    user.remove(function (err, user) {
      if (err) return next(err);

        req.logout();
        req.flash('info', 'Your account has been deleted.');
        res.redirect('/login');
      
    });
  });
};

exports.subUserDeleteAccount = function(req, res, next){
  User.findById(req.params.id, function(err, user) {
    if (err) return next(err);

    user.remove(function (err, user) {
      if (err) return next(err);

        req.flash('info', 'The selected user account has been deleted.');
        res.redirect('/users');
      
    });
  });
};

exports.confirmAccount = (req, res, next) => {
  req.assert('email', 'Email is not valid').isEmail();
	req.assert('email', 'Email cannot be blank').notEmpty();
	req.assert('token', 'Token cannot be blank').notEmpty();
	req.sanitize('email').normalizeEmail({ remove_dots: false });
	 
	// Check for validation errors    
	var errors = req.validationErrors();
	if (errors) return res.status(400).send(errors);
	
  // Find a matching token
	Token.findOne({ token: req.body.token }, function (err, token) {
	  if (!token) return res.status(400).send(req.flash('error', 'We were unable to find a valid token. Your token my have expired.'));
	 
	  // If we found a token, find a matching user
	  User.findOne({ _id: token._userId }, function (err, user) {
	    if (!user) return res.status(400).render('errors/400', {errorCode: '400', message: 'We were unable to find a user for this token.'});
	    if (user.isVerified) return res.status(400).send(req.flash('error', 'This user has already been verified.'));
	 
	    // Verify and save the user
	    user.isVerified = true;
	    user.save(function (err) {
	      if (err) { return res.status(500).send({ msg: err.message }); }
	      req.flash('success', 'Your account has been verified.');
	      res.redirect('/company/profile');
	    });
	  });
	});
};


exports.getForgotPassword = function(req, res){
  if (req.isAuthenticated()) {
    return res.redirect('/login');
  }
  var form = {},
  error = null,
  formFlash = req.flash('form'),
  errorFlash = req.flash('error');

  if (formFlash.length) {
    form.email = formFlash[0].email;
  }
  if (errorFlash.length) {
    error = errorFlash[0];
  }
  res.render(req.render, {
    title: 'Forgot Password',
    form: form,
    error: error
  });
};

exports.postForgotPassword = (req, res, next) => {
  req.assert('email', 'Please enter a valid email address.').isEmail();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('form', {
      email: req.body.email
    });
    req.flash('errors', errors);
    console.log(errors);
    return res.redirect('/forgot');
  }

  async.waterfall([
    function(done) {
      crypto.randomBytes(16, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email.toLowerCase() }, function(err, user) {
      if(err){
        console.log(err);
      }
        if (!user) {
          req.flash('form', {
            email: req.body.email
          });
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
     
      var newUserEmail = req.body.email;
      var message= 'You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n';
      sendEmail('noreply@sailhr.com', newUserEmail, 'Reset your password on Sail HR', message);
      res.redirect('/login');
    }
  ], function(err) {
    if (err) return next(err);
    
  });
};

exports.postToken = function(req, res, next){
  req.assert('password', 'Password must be at least 6 characters long.').len(6);
  req.assert('confirm', 'Passwords must match.').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/forgot');
  }

  async.waterfall([
    function(done) {
      User
        .findOne({ resetPasswordToken: req.params.token })
        .where('resetPasswordExpires').gt(Date.now())
        .exec(function(err, user) {
          if(err){
            console.log(err);
          }
          if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
          }

          user.password = req.body.password;
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;

          user.save(function(err) {
            if (err) return next(err);
            var time = 14 * 24 * 3600000;
            req.session.cookie.maxAge = time; //2 weeks
            req.session.cookie.expires = new Date(Date.now() + time);
            req.session.touch();

            req.logIn(user, function(err) {
              done(err, user);
            });
          });
        });
    },
    function(user, done) {
      var message = 'Hello,\n\n' + 'this is a confirmation that the password for your account ' + user.email + ' has just been changed.\n';
      sendEmail('noreply@sailhr.com', user.email, 'Reset your password on Sail HR', message);
      req.flash('success',  'Success! Your password has been changed.');
      res.redirect('/login');
    }
  ], function(err) {
    if (err) return next(err);
    
  });
};

exports.getToken = function(req, res){
  var form = {},
  error = null,
  formFlash = req.flash('form'),
  errorFlash = req.flash('error');

  if (formFlash.length) {
    form.email = formFlash[0].email;
  }
  if (errorFlash.length) {
    error = errorFlash[0];
  }

  User
    .findOne({ resetPasswordToken: req.params.token })
    .where('resetPasswordExpires').gt(Date.now())
    .exec(function(err, user) {
      if(err){
        console.log(err);
      }
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('/');
      }
    });
};