exports.setRender = function(view){
  return function(req, res, next){
    req.render = view;

    next();
  };
};