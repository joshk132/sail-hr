exports.noPlanLimiter = (req, res, next) => {
    if(req.user.company.stripe.plan != 'Frigate' && req.user.company.stripe.plan != 'Battleship') {
        req.flash('error', 'Sorry but you first must select a plan.');
        res.redirect('/company/billing');
    } else {
        next();
    }
};