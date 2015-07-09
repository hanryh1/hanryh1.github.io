var express = require('express');
var configController = require("../controllers/timeConfigController");
var router = express.Router();

var isAdmin = function(req, res, next){
    if (req.session.admin) {
        return next();
    } else{
        res.redirect('/');
    }
}

// configure stuff like getting nationals results
router.get('/config', isAdmin, function(req, res) {
    res.render("config");
});

router.post('/config/meet', isAdmin, configController.createReferenceTimesForMeet);

router.post('/config/standards', isAdmin, configController.createTimeStandards);

module.exports = router;
