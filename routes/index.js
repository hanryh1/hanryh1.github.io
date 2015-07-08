var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  if (req.session.authenticated){
    res.redirect('/recruits')
  } else{
    res.render('index');
  }
});

router.post('/authenticate', function(req, res){
    if (req.body.password == process.env.ADMIN_PASSWORD){
        req.session.admin = true;
        req.session.authenticated = true;
        res.redirect('/admin/config');
    } else if (req.body.password == process.env.SMR_PASSWORD){
        req.session.authenticated = true;
        res.redirect('/recruits');
    } else {
        res.render('index', {'error': 'Invalid Password'});
    }
});

/* GET home page. */
router.post('/logout', function(req, res) {
  req.session = null;
  res.status(200).send({'message': 'Logout successful.'});
});


module.exports = router;
