var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
var timestamps = require('mongoose-timestamp');
var bcrypt = require('bcrypt-nodejs');
var stripeCustomer = require('./plugins/stripe-customer');
var config = require("../config/config");

var UserSchema = new mongoose.Schema({
    email: String,
    password: String,
    role: String,
    avatar: { type: String, default: 'default_profile_image.png'},
    companyID: String,
    
    isVerified: { type: Boolean, default: false },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    
    company: {
      companyName: { type: String, default: 'New Company' },
      companyDomain: String,
      customForms: [{type: String}],
      companyAddress: String,
      companySize: Number,
      subUserCount: { type: Number, default: 1},
      stripe: {
        customerId: String,
        subscriptionId: String,
        last4: String,
        plan: String,
        isCoupon: {
          type: Boolean,
          default: false
        }
      },
    },
    
    employee: {
      personal: {
        firstName: String,
        middleName: String,
        lastName: String,
        birthday: String,
        socialNumber: String,
        gender: Boolean, // false = male true = female
        address: String,
        maritalStatus: String
      },
      contactInfo: {
          homePhoneNumber: String,
          cellPhoneNumber: String,
          personalEmail: String,
          emergencyContact: {
              firstName: String,
              lastName: String,
              phoneNumber: String
          }
      },
      education: {
          postSecondary: String,
          certifications: String,
      },
      clothing: {
          shirtSize: String,
          pantSize: Number
      },
      employeeData: {
        employeeID: String,
        employmentType: String,
        hireDate: String,
        leavingDate: String,
        financialPlanEnrollMent: {type: Boolean, default: false},
        trainingDue: {type: Boolean, default: false},
        jobTitle: String,
        location: String,
        department: String,
        employmentStatus: String,
        manager: String
      },
      lastChangedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    }
    
});


var stripeOptions = config.stripeOptions;


UserSchema.plugin(passportLocalMongoose, { usernameField : 'email' });
UserSchema.plugin(timestamps);
UserSchema.plugin(stripeCustomer, stripeOptions);

UserSchema.pre('save', function(next) {
  var user = this;

  if (!user.isModified('password')) return next();

  bcrypt.genSalt(10, function(err, salt) {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};


module.exports = mongoose.model("User", UserSchema);