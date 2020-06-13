// Config
const config = require("../config/config");

// Packages needed
const LocalStrategy   = require('passport-local').Strategy;
const crypto = require('crypto');
const uuidv4 = require('uuid/v4');

// Models
const User    = require('../models/user');
const Token   = require("../models/token");

// Custom functions
const sendEmail = require('../utils/sendEmail');


// expose this function to the app using module.exports
module.exports = function(passport) {


    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });
    


passport.use('signup', new LocalStrategy({
      usernameField: 'email',
      passReqToCallback : true
    },
    function(req, email, password, done) {
        User.findOne({ email: req.body.email }, function(err, existingUser) {
          if(err){
            console.log(err);
          }
          if (existingUser) {
            req.flash('form', {
              email: req.body.email
            });
            return done(null, false, req.flash('error', 'An account with that email address already exists.'));
          }
          var companyID = uuidv4();
          // edit this portion to accept other properties when creating a user.
          var user = new User({
            email: req.body.email,
            password: req.body.password, // user schema pre save task hashes this password
            role: 'company',
            companyID: companyID
          });

          user.save(function(err) {
            if (err) return done(err, false, req.flash('error', 'Error saving user.'));
            
            var token = new Token({ _userId: user._id, token: crypto.randomBytes(16).toString('hex') });
            token.save(function (err) {
            if (err) return done(null, false, req.flash('error', err.message));
            var email = req.body.email;
            // Send the email for the token
            var message = 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/user/confirmation\/' + token.token + '\/' + email + '\n';
            sendEmail('"Sail HR" noreply@sailhr.com', user.email, 'Account Verification Token', message);
            });
            var time = 14 * 24 * 3600000;
            req.session.cookie.maxAge = time; //2 weeks
            req.session.cookie.expires = new Date(Date.now() + time);
            req.session.touch();
            return done(null, user, req.flash('success', 'A verification email has been sent to ' + user.email + '. Verfication token expires in 12 hours.'));
          });
        });

    })
  );
  
passport.use('signup-sub', new LocalStrategy({
      usernameField: 'email',
      passReqToCallback : true
    },
    function(req, email, password, done) {
        User.findOne({ email: req.body.email }, function(err, existingUser) {
          if(err){
            console.log(err);
          }
          if (existingUser) {
            req.flash('form', {
              email: req.body.email
            });
            return done(null, false, req.flash('error', 'An account with that email address already exists.'));
          }
          
          // setting values for checkboxes
          var role = '';
          var preRole = req.body.role;
          if (req.body.hrRole == 'on' && preRole == 'undefined') {
            role = 'hrManager';
          } else if (req.body.hrRole == 'on' && preRole == 'on') {
            role = 'hr';
          } else {
            if (preRole === undefined) {
              role = 'manager';
            } else if (preRole === 'on')  {
              role = 'employee';
            }
          }
          
          var gender = '';
          if (req.body.gender === undefined) {
            gender = false;
          } else {
            gender = true;
          }
          
          var financialPlanEnrollMent = '';
          if (req.body.financialPlanEnrollMent === undefined) {
            financialPlanEnrollMent = false;
          } else {
            financialPlanEnrollMent = true;
          }
          var trainingDue = '';
          if (req.body.trainingDue === undefined) {
            trainingDue = false;
          } else {
            trainingDue = true;
          }
          
          var employmentStatus = '';
          if (req.body.employmentStatus === undefined) {
            employmentStatus = 'Not Active';
          } else {
            employmentStatus = 'Active';
          }
          
          // setting value for email using company domain name
          email = req.body.email + req.user.company.companyDomain;
          
          // edit this portion to accept other properties when creating a user.
          var user = new User({
            email: email,
            password: req.body.password, // user schema pre save task hashes this password
            role: role,
            companyID: req.user.companyID,
            employee: {
              personal: {
                firstName: req.body.first,
                middleName: req.body.middle,
                lastName: req.body.last,
                birthday: req.body.birthDate,
                socialNumber: req.body.social,
                gender: gender,
                address: req.body.address,
                maritalStatus: req.body.marital
              },
              contactInfo: {
                  homePhoneNumber: req.body.home,
                  cellPhoneNumber: req.body.cell,
                  personalEmail: req.body.personalEmailemail,
                  emergencyContact: {
                      firstName: req.body.emergencyContactPhoneFist,
                      lastName: req.body.emergencyContactPhoneLast,
                      phoneNumber: req.body.emergencyContactPhone
                  }
              },
              education: {
                  postSecondary: req.body.postSecondary,
                  certifications: req.body.certs
              },
              clothing: {
                  shirtSize: req.body.shirtSize,
                  pantSize: req.body.pantSize
              },
              employeeData: {
                employeeID: req.body.employeeID,
                employmentType: req.body.employmentType,
                hireDate: req.body.hireDate,
                leavingDate: req.body.leavingDate,
                financialPlanEnrollMent: financialPlanEnrollMent,
                trainingDue: trainingDue,
                jobTitle: req.body.jobTitle,
                location: req.body.location,
                department: req.body.department,
                employmentStatus: employmentStatus,
                manager: req.body.manager
              },
              lastChangedBy: req.user.id
            }
            
          });
          
          if(role === 'hrManager') {
            role = 'HR Manager';
          }
          
          user.save(function(err) {
            if (err) return done(err, false, req.flash('error', 'Error saving user.'));
            
            var time = 14 * 24 * 3600000;
            req.session.cookie.maxAge = time; //2 weeks
            req.session.cookie.expires = new Date(Date.now() + time);
            req.session.touch();
            return done(null, user, req.flash('success', `Your new ${role} has been created.`));
          });
        });

    })
  );



passport.use('login', new LocalStrategy({
      usernameField: 'email',
      passReqToCallback : true
    },
    function(req, email, password, done) {
      User.findOne({ 'email' :  email },
        function(err, user) {
          if (err) return done(err);
          if (!user){
            return done(null, false, req.flash('error', 'No user with that email was found.'));
          }
          user.comparePassword(password, function(err, isMatch) {
            if(err){
              done(err);
            }
            if (isMatch) {
              // Make sure the user has been verified
              if (!user.isVerified) return done (null, false, req.flash('error', 'Your account has not been verified.' ));
              var time = 14 * 24 * 3600000;
              req.session.cookie.maxAge = time; //2 weeks
              req.session.cookie.expires = new Date(Date.now() + time);
              req.session.touch();
              return done(null, user, req.flash('success', 'Successfully logged in ' + user.email + '.'));
            } else {
              return done(null, false, req.flash('error', 'Invalid Password'));
            }
            
          });
        }
      );
    })
  );

};