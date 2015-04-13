var express = require('express');
var router = express.Router();
var RecruitController = require('../controllers/recruitController');

router.post('/', RecruitController.createRecruit);

router.get('/', RecruitController.getAllRecruits);

router.get('/:id', RecruitController.getRecruit);

router.get('/:recruitId/times', RecruitController.getTimesForRecruit);

var isAuthenticated = function(req, res, next){
    if (req.session.user) {
        return next()
    } else{
    res.status(401).send({'error': 'You must be logged in to complete that action.'});
    }
}

module.exports = router;
