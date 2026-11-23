const router = require('express').Router();
const ctrl = require('./controller');
const { requireAuth, requireRole } = require('../../lib/auth');

router.post('/intent', requireAuth, ctrl.create);
router.get('/:id', requireAuth, ctrl.get);
router.post('/webhook/:provider', ctrl.webhook);

module.exports = router;
