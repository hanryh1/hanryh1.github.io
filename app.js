"use strict";
var express       = require('express');

/* Middleware */
var path          = require('path');
var favicon       = require('serve-favicon');
var logger        = require('morgan');
var cookieParser  = require('cookie-parser');
var bodyParser    = require('body-parser');
var csrf          = require('csurf');
var cookieSession = require('cookie-session');
var mongoose      = require('mongoose');

/* Routes */
var routes        = require('./routes/index');
var recruits      = require('./routes/recruits');
var events        = require('./routes/events');
var admin         = require('./routes/admin');
var compare       = require('./routes/compare');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

var db = mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/stalkmyrecruit");

app.use(favicon(__dirname + '/public/favicon.ico'));

/* Filter out static content from being logged */
function filter(middleware) {
  return function(req, res, next) {
    if (/\/js|\/stylesheets|\/fonts/.test(req.path)) {
      return next();
    } else {
      return middleware(req, res, next);
    }
  };
};

app.use(filter(logger('common')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

/* only send cookies over https if SECURE_PROXY env variable set */
var cookieSessionArgs = {secret: process.env.SMR_SESSION_SECRET};
if (process.env.SECURE_PROXY) {
  cookieSessionArgs["secureProxy"] = true;
  app.enable("trust proxy");
}
app.use(cookieSession(cookieSessionArgs));
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req, res, next) {
  if (req.path === "/logout") {
      next();
  } else {
    csrf()(req, res, next);
  }
});

app.use('/', routes);
app.use('/recruits', recruits);
app.use('/events', events);
app.use('/admin', admin);
app.use('/compare', compare);

//include models
require('./models/recruit');
require('./models/referenceTime');
require('./models/time');

/* 404 Error Handler */
app.use(function(req, res, next) {
  res.render('404');
});

//don't send X-Powered-By header
app.disable('x-powered-by');

/* Error Handlers */
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

/* Background jobs */
require('./lib/updateRecruits').updateRecruitsJob.start();

var debug = require('debug')('stalkmyrecruit');

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function() {
  debug('Express server listening on port ' + server.address().port);
});

module.exports = app;
