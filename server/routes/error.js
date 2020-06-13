var isUnauthenticated = require('../middleware/auth').isUnauthenticated,
    isAuthenticated = require('../middleware/auth').isAuthenticated;

module.exports = function(app, passport) {


// error 404 page not found
app.get('*', (req, res) => {
    res.status(404);
   res.render('errors/404', {errorCode: 404});
});
	
};