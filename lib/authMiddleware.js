var auth = {};

auth.isAuthenticated = function(req, res, next) {
  if (req.session.authenticated) {
    return next()
  } else{
    res.redirect('/');
  }
}

auth.isAdmin = function(req, res, next) {
  if (req.session.admin) {
    return next();
  } else{
    res.redirect('/');
  }
}

module.exports = auth;
