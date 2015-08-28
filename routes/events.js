var express         = require('express');
var router          = express.Router();
var controller      = require('../controllers/timesController');
var isAuthenticated = require('../lib/authMiddleware').isAuthenticated;

router.get('/', isAuthenticated, controller.renderEventsView);

router.get('/rank', isAuthenticated, controller.getTimesByEventGenderYear);

module.exports = router;
