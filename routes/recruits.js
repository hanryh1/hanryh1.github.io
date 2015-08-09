var express = require('express');
var router = express.Router();
var RecruitController = require('../controllers/recruitController');

var isAuthenticated = function(req, res, next){
    if (req.session.authenticated) {
        return next()
    } else{
        res.redirect('/');
    }
}

var isAdmin = function(req, res, next){
    if (req.session.admin) {
        return next();
    } else{
        res.redirect('/');
    }
}

router.post('/', isAuthenticated, RecruitController.createRecruit);

router.get('/', isAuthenticated, RecruitController.getAllRecruits);

router.get('/csv', isAuthenticated, RecruitController.downloadRecruitCsv);

router.get('/archived', isAuthenticated, RecruitController.getArchivedRecruits);

router.get('/archived/:classYear', isAuthenticated, RecruitController.getArchivedRecruits);

router.get('/:recruitId', isAuthenticated, RecruitController.getRecruit);

router.get('/:recruitId/times', isAuthenticated, RecruitController.getTimesForRecruit);

router.post('/:recruitId/times', isAuthenticated, function(req, res){ RecruitController.addTimeManually(req, res, true) });

/* Lazy Implementation */
router.put('/:recruitId/times/:timeId', isAuthenticated, function(req, res){ RecruitController.addTimeManually(req, res, false) });

router.put('/', isAuthenticated, RecruitController.archiveAllRecruits);

router.put('/:recruitId', isAuthenticated, RecruitController.archiveRecruit);

router.put('/:recruitId/info', isAuthenticated, RecruitController.updateRecruit);

router.delete('/:recruitId', isAuthenticated, RecruitController.deleteRecruit);

router.delete('/:recruitId/times/:timeId', isAuthenticated, RecruitController.deleteTime);

module.exports = router;
