const router = require('express').Router();
const ctrl = require('./controller');

router.get('/', ctrl.search);

module.exports = router;
