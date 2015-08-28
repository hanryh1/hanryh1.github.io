var express          = require('express');
var router           = express.Router();
var configController = require("../controllers/configController");
var isAdmin          = require("../lib/authMiddleware").isAdmin;
var isAuthenticated  = require('../lib/authMiddleware').isAuthenticated;
var Configuration    = require('../models/configuration');

// configure stuff like getting nationals results
router.get('/config', isAuthenticated, isAdmin, function(req, res) {
  Configuration.getDefaultYear(function(err, year){
    if (err) {
      res.status(500).send(err);
    } else {
      res.render("config", {"csrf": req.csrfToken(), "defaultYear": year});
    }
  });
});

router.post('/config/year', isAuthenticated, isAdmin, configController.setDefaultYear);

router.post('/config/meet', isAuthenticated, isAdmin, configController.createReferenceTimesForMeet);

router.post('/config/standards', isAuthenticated, isAdmin, configController.createTimeStandards);

router.post('/config/team', isAuthenticated, isAdmin, configController.updateTeamReferenceTimes);

router.post('/recruits', isAuthenticated, isAdmin, configController.updateAllRecruits);

module.exports = router;
