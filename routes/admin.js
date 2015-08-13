var express          = require('express');
var router           = express.Router();
var configController = require("../controllers/timeConfigController");

function isAdmin(req, res, next) {
    if (req.session.admin) {
        return next();
    } else{
        res.redirect('/');
    }
}

// configure stuff like getting nationals results
router.get('/config', isAdmin, function(req, res) {
    res.render("config", {"csrf": req.csrfToken()});
});

router.post('/config/meet', isAdmin, configController.createReferenceTimesForMeet);

router.post('/config/standards', isAdmin, configController.createTimeStandards);

router.post('/config/team', isAdmin, configController.updateTeamReferenceTimes);

router.post('/recruits', isAdmin, configController.updateAllRecruits);

module.exports = router;
