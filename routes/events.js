var express         = require('express');
var router          = express.Router();
var controller      = require('../controllers/timesController');
var isAuthenticated = require('../lib/authMiddleware').isAuthenticated;

router.get('/', isAuthenticated, function(req, res){
  res.render('events');
});

router.get('/rank', isAuthenticated, controller.getTimesByEventAndGender);

module.exports = router;