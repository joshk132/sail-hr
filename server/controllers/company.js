var User = require('../models/user');
var crypto = require('crypto');
var sendEmail = require('../utils/sendEmail');
var Token = require("../models/token");



// Removes account
exports.deleteAccount = function(req, res, next){
  User.findById(req.user.id, function(err, user) {
    if (err) return next(err);

    user.remove(function (err, user) {
      if (err) return next(err);
      user.cancelStripe(function(err){
        if (err) return next(err);

        req.logout();
        req.flash('info', 'Your account has been deleted.');
        res.redirect('/login');
      });
    });
  });
};

// Adds or updates a users card.l
exports.postBilling = function(req, res, next){
var stripeToken = req.body.stripeToken;
// var stripeToken = token.id;
  if(!stripeToken){
    req.flash('errors', 'Please provide a valid card.');
    return res.redirect('/user/settings');
  }

  User.findById(req.user.id, function(err, user) {
    if (err) return next(err);

    user.setCard(stripeToken, function (err) {
      if (err) {
        if(err.code && err.code == 'card_declined'){
          req.flash('errors', 'Your card was declined. Please provide a valid card.');
          return res.redirect('/user/settings');
        }
        req.flash('errors', 'An unexpected error occurred.');
        return res.redirect('/user/settings');
      }
      req.flash('success', 'Your card has beed added.');
      res.redirect('/company/billing');
    });
  });

};

exports.postPlan = function(req, res, next){
  var plan = req.body.plan;
  var coupon = req.body.coupon;
  if (coupon) {
    req.user.isUsedCoupon = true;
  }
  var stripeToken = null;
  // if(plan){
  //   plan = plan.toLowerCase();
  // }

  if(req.user.company.stripe.plan == plan){
    req.flash('info',  'The selected plan is the same as the current plan.');
    return res.redirect('/company/billing');
  }
  
  if(req.body.stripeToken){
    stripeToken = req.body.stripeToken;
  }
  
  if(!req.user.company.stripe.last4){
    req.flash('error',  'Please add a card to your account before choosing a plan.');
    return res.status(401).redirect('/company/billing');
  }
  
  User.findById(req.user.id, function(err, user) {
    if (err) return next(err);
    var quantity = user.company.stripe.subUserCount;
    user.setPlan(plan, coupon, quantity, stripeToken, function (err) {
      var msg;
      if (err) {
        if(err.code && err.code == 'card_declined'){
          msg = 'Your card was declined. Please provide a valid card.';
        } else if(err && err.message) {
          msg = err.message;
        } else {
          msg = 'An unexpected error occurred.';
        }
        req.flash('errors', msg);
        return res.redirect('/company/billing');
      }
      req.flash('success',  'Your plan has been updated.');
      res.redirect('/company/billing');
    });
  });
};

exports.postNewUserPlan = function(req, res, next){
  var plan = req.user.company.stripe.plan;
  var coupon = null;
  var stripeToken = null;
  plan = plan.toLowerCase();
  
  if(req.body.stripeToken){
    stripeToken = req.body.stripeToken;
  }
  
  User.find({companyID: req.user.companyID}, function(err, user) {
    if (err) return next(err);
    user = user[0];
    var quantity = user.company.subUserCount + 1;
    user.setPlan(plan, coupon, quantity, stripeToken, function (err) {
      var msg;
      
      if (err) {
        if(err.code && err.code == 'card_declined'){
          msg = 'Your card was declined. Please provide a valid card.';
        } else if(err && err.message) {
          msg = err.message;
        } else {
          msg = 'An unexpected error occurred.';
        }
        req.flash('errors', msg);
        return res.redirect('/user/create');
      }
    });
  });
  next();
};

exports.postDeleteUserPlan = function(req, res, next){
  var plan = req.user.company.stripe.plan;
  var coupon = null;
  var stripeToken = null;
  plan = plan.toLowerCase();
  
  if(req.body.stripeToken){
    stripeToken = req.body.stripeToken;
  }
  
  User.findById(req.user.id, function(err, user) {
    if (err) return next(err);
    var quantity = user.company.subUserCount - 1;
    user.setPlan(plan, coupon, quantity, stripeToken, function (err) {
      var msg;
      
      if (err) {
        if(err.code && err.code == 'card_declined'){
          msg = 'Your card was declined. Please provide a valid card.';
        } else if(err && err.message) {
          msg = err.message;
        } else {
          msg = 'An unexpected error occurred.';
        }
        req.flash('errors', msg);
        return res.redirect('/users');
      }
    });
  });
  next();
};

// POST /confirmation
exports.confirmationPost = function (req, res, next) {
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('email', 'Email cannot be blank').notEmpty();
    req.assert('token', 'Token cannot be blank').notEmpty();
    req.sanitize('email').normalizeEmail({ remove_dots: false });
 
    // Check for validation errors    
    var errors = req.validationErrors();
    if (errors) return res.status(400).send(errors);
 
    // Find a matching token
    Token.findOne({ token: req.body.token }, function (err, token) {
        if (!token) return res.status(400).send('We were unable to find a valid token. Your token my have expired.');
 
        // If we found a token, find a matching user
        User.findOne({ _id: token._userId }, function (err, user) {
            if (!user) return res.status(400).send( 'We were unable to find a user for this token.');
            if (user.isVerified) return res.status(400).send('This user has already been verified.' );
 
            // Verify and save the user
            user.isVerified = true;
            user.save(function (err) {
                if (err) { return res.status(500).send(err.message); }
                req.flash('success',  'Your account has been verified.');
                res.redirect('/company/settings');
            });
        });
    });
};

exports.resendTokenPost = function (req, res, next) {
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('email', 'Email cannot be blank').notEmpty();
    req.sanitize('email').normalizeEmail({ remove_dots: false });
 
    // Check for validation errors    
    var errors = req.validationErrors();
    if (errors) return res.status(400).send(errors);
 
    User.findOne({ email: req.body.email }, function (err, user) {
      if(err) throw err;
        if (!user) return res.status(400).send('We were unable to find a user with that email.');
        if (user.isVerified) return res.status(400).send( 'This account has already been verified. Please log in.');
 
        // Create a verification token, save it, and send email
        var token = new Token({ _userId: user._id, token: crypto.randomBytes(16).toString('hex') });
 
        // Save the token
        token.save(function (err) {
            if (err) { return res.status(500).send(err.message); }
 
            // Send the email
            sendEmail('"Sail HR" noreply@sailhr.com', user.email, 'Account Verification Token', 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + token.token + '.\n');
        });
 
    });
};

exports.postCoupon = function(req, res, next){
  User.findById(req.user.id, function(err, user) {
    if (err) return next(err);

  });
};

exports.postProfile = function(req, res, next) {
  User.findById(req.user.id, (err, user) => {
    if (err) return next(err);
    
    if(user.company.companyName == 'New Company') {
      user.company.companyDomain = req.body.companyDomain;
    user.company.companyAddress = req.body.companyAddress;
    user.company.companySize = req.body.companySize;
    user.company.companyName = req.body.companyName;
    user.save((err) => {
      if (err) return res.status(500).send(err.message);
      req.flash('success', 'Your company information has been saved.');
      res.redirect('/company/billing');
    });
    } else {
    user.company.companyDomain = req.body.companyDomain;
    user.company.companyAddress = req.body.companyAddress;
    user.company.companySize = req.body.companySize;
    user.company.companyName = req.body.companyName;
    user.save((err) => {
      if (err) return res.status(500).send(err.message);
      req.flash('success', 'Your company information has been saved.');
      res.redirect('/company/profile');
    }); 
    }
  });
};