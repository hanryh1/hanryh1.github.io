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

router.get('/:id', isAuthenticated, RecruitController.getRecruit);

router.get('/:recruitId/times', isAuthenticated, RecruitController.getTimesForRecruit);

router.delete('/:recruitId', isAuthenticated, RecruitController.deleteRecruit);

module.exports = router;
