var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var recruits = require('./routes/recruits');
var events = require('./routes/events');
var session = require('express-session');

var mongoose = require('mongoose');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

db = mongoose.connect(process.env.MONGOLAB_URI || "mongodb://localhost/stalkmyrecruit");

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({secret: process.env.SMR_SESSION_SECRET, resave: true, saveUninitialized: true }));
app.use(express.static(path.join(__dirname, 'public')));

//redirect to actual domain
if (process.env.NODE_ENV === 'production'){
    app.get('*', function(req, res, next) {
        if (req.headers.host != process.env.HOST_NAME) {
            res.redirect(301, 'http://' + process.env.HOST_NAME + req.url);
        } else {
            next();
        }
    });
}

app.use('/', routes);
app.use('/recruits', recruits);
app.use('/events', events);

//include models
require('./models/recruit');
require('./models/referenceTime');
require('./models/time');

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    res.render('404');
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

// include background jobs
require('./jobs');

var debug = require('debug')('stalkmyrecruit');

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function() {
  debug('Express server listening on port ' + server.address().port);
});

module.exports = app;
