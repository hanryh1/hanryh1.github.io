var express = require('express');
var router = express.Router();
var controller = require('../controllers/timesController');

var isAuthenticated = function(req, res, next){
    if (req.session.authenticated) {
        return next()
    } else{
        res.redirect('/');
    }
}

router.get('/', function(req, res){
    res.render('events');
});

router.get('/rank', controller.getTimesByEventAndGender);

module.exports = router;