var express          = require('express');
var router           = express.Router();
var configController = require("../controllers/timeConfigController");
var isAdmin          = require("../lib/authMiddleware").isAdmin;
var isAuthenticated  = require('../lib/authMiddleware').isAuthenticated;

// configure stuff like getting nationals results
router.get('/config', isAuthenticated, isAdmin, function(req, res) {
  res.render("config", {"csrf": req.csrfToken()});
});

router.post('/config/meet', isAuthenticated, isAdmin, configController.createReferenceTimesForMeet);

router.post('/config/standards', isAuthenticated, isAdmin, configController.createTimeStandards);

router.post('/config/team', isAuthenticated, isAdmin, configController.updateTeamReferenceTimes);

router.post('/recruits', isAuthenticated, isAdmin, configController.updateAllRecruits);

module.exports = router;
