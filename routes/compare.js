var express         = require('express');
var router          = express.Router();
var controller      = require('../controllers/referenceController');
var isAuthenticated = require('../lib/authMiddleware').isAuthenticated;

router.get('/', isAuthenticated, controller.getComparisonPage);

router.get('/swimmers', isAuthenticated, controller.getRecruitsAndRoster);

router.get('/times', isAuthenticated, controller.compareSwimmerToTeamMember);

module.exports = router;
