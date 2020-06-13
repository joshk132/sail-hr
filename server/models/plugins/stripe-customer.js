'use strict';

var Stripe = require('stripe'),
stripe;

module.exports = exports = function stripeCustomer (schema, options) {
  stripe = Stripe(options.apiKey);

  schema.pre('save', function (next) {
    var user = this;
    if(!user.isNew || user.company.stripe.customerId) return next();
    user.createCustomer(function(err){
      if (err) return next(err);
      next();
    });
  });

  schema.statics.getPlans = function () {
    return options.planData;
  };

  schema.methods.createCustomer = function(cb) {
    var user = this;

    if(!user.companyID) {
      stripe.customers.create({
      email: user.email
    }, function(err, customer){
      if (err) return cb(err);

      user.company.stripe.customerId = customer.id;
      return cb();
    });
    } else {
      return cb();
    }
  
    
    
  };

  schema.methods.setCard = function(stripe_token, cb) {
    var user = this;

    var cardHandler = function(err, customer) {
      if (err) return cb(err);

      if(!user.company.stripe.customerId){
        user.company.stripe.customerId = customer.id;
      }

      var card = customer.cards ? customer.cards.data[0] : customer.sources.data[0];
      
      user.company.stripe.last4 = card.last4;
      user.save(function(err){
        if (err) return cb(err);
        return cb(null);
      });
    };

    if(user.company.stripe.customerId){
      stripe.customers.update(user.company.stripe.customerId, {card: stripe_token}, cardHandler);
    } else {
      stripe.customers.create({
        email: user.email,
        card: stripe_token
      }, cardHandler);
    }
  };

  schema.methods.setPlan = function(plan, coupon, quantity, stripe_token, cb) {
    var user = this;

    var subscriptionHandler = function(err, subscription) {
      if(err) return cb(err);

      user.company.stripe.plan = plan;
      user.company.stripe.subscriptionId = subscription.id;
      user.company.subUserCount = quantity;
      user.save(function(err){
        if (err) return cb(err);
        return cb(null);
      });
    };

    var createSubscription = function(){
      stripe.customers.createSubscription(
        user.company.stripe.customerId,
        {plan: plan, coupon: coupon, quantity: quantity},
        subscriptionHandler
      );
    };

    if(stripe_token) {
      user.setCard(stripe_token, function(err){
        if (err) return cb(err);
        createSubscription();
      });
    } else {
      if (user.company.stripe.subscriptionId){
        // update subscription
        stripe.customers.updateSubscription(
          user.company.stripe.customerId,
          user.company.stripe.subscriptionId,
          { plan: plan, coupon: coupon, quantity: quantity },
          subscriptionHandler
        );
      } else {
        createSubscription();
      }
    }
  };

  schema.methods.updateStripeEmail = function(cb){
    var user = this;

    if(!user.company.stripe.customerId) return cb();

    stripe.customers.update(user.company.stripe.customerId, {email: user.email}, function(err, customer) {
      cb(err);
    });
  };

  schema.methods.cancelStripe = function(cb){
    var user = this;

    if(user.company.stripe.customerId){
      stripe.customers.del(
        user.company.stripe.customerId
      ).then(function(confirmation) {
        cb();
      }, function(err) {
        return cb(err);
      });
    } else {
      cb();
    }
  };
};