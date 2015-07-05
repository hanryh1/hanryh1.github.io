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

router.post('/', isAuthenticated, RecruitController.createRecruit);

router.get('/', isAuthenticated, RecruitController.getAllRecruits);

router.get('/archived', isAuthenticated, RecruitController.getArchivedRecruits);

router.get('/archived/:classYear', isAuthenticated, RecruitController.getArchivedRecruitsByYear);

router.get('/:id', isAuthenticated, RecruitController.getRecruit);

router.get('/:recruitId/times', isAuthenticated, RecruitController.getTimesForRecruit);

router.post('/:recruitId/times', isAuthenticated, RecruitController.addTimeManually);

router.put('/:recruitId', isAuthenticated, RecruitController.archiveRecruit);

router.delete('/:recruitId', isAuthenticated, RecruitController.deleteRecruit);

router.delete('/times/:timeId', isAuthenticated, RecruitController.deleteTime);

module.exports = router;
