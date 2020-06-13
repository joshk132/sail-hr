'use strict';
var User = require("../models/user"); 

exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()){
    res.locals.currentUser = req.user;
    if(req.user.role != 'company') {
      res.locals.sidebarName = req.user.employee.personal.firstName;
    } else {
      res.locals.sidebarName = req.user.company.companyName;
    }
    return next();
  }
  req.flash("error", "You need to be logged in to do that");
  res.redirect('/login');
};

exports.isUnauthenticated = (req, res, next) => {
  if (!req.isAuthenticated()){
    res.locals.currentUser = {email: null};
    return next();
  }
  
  res.redirect('/dashboard');
};

exports.isCompany = (req, res, next) => {
  if(req.user.role === 'company') {
    return next();
  }
  req.flash("error", "You need to be the company account holder to access this page.");
  res.redirect('/dashboard');
};

exports.isHR = (req, res, next) => {
  if(req.user.role === 'hr' || req.user.role === 'hrManager' || req.user.role === 'company') {
    return next();
  }
  req.flash("error", "You need to be an HR representative to access this page.");
  res.redirect('/dashboard');
};