var express    = require('express');
var router     = express.Router();
var controller = require('../controllers/recruitController');

function isAuthenticated(req, res, next) {
  if (req.session.authenticated) {
    return next()
  } else{
    res.redirect('/');
  }
}

function isAdmin(req, res, next) {
  if (req.session.admin) {
    return next();
  } else{
    res.redirect('/');
  }
}

router.post('/', isAuthenticated, controller.createRecruit);

router.get('/', isAuthenticated, controller.getAllRecruits);

router.get('/csv', isAuthenticated, controller.downloadRecruitCsv);

router.get('/archived', isAuthenticated, controller.getArchivedRecruits);

router.get('/archived/:classYear', isAuthenticated, controller.getArchivedRecruits);

router.get('/:recruitId', isAuthenticated, controller.getRecruit);

router.get('/:recruitId/times', isAuthenticated, controller.getTimesForRecruit);

router.post('/:recruitId/times', isAuthenticated, function(req, res){ controller.addTimeManually(req, res, true) });

/* Lazy Implementation */
router.put('/:recruitId/times/:timeId', isAuthenticated, function(req, res){ controller.addTimeManually(req, res, false) });

router.put('/', isAuthenticated, controller.archiveAllRecruits);

router.put('/:recruitId', isAuthenticated, controller.archiveRecruit);

router.put('/:recruitId/info', isAuthenticated, controller.updateRecruit);

router.delete('/:recruitId', isAuthenticated, controller.deleteRecruit);

router.delete('/:recruitId/times/:timeId', isAuthenticated, controller.deleteTime);

module.exports = router;
