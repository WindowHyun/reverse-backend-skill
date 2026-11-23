const router = require('express').Router();
const ctrl = require('./controller');
const { requireAuth, requireRole } = require('../../lib/auth');

router.get('/', requireAuth, ctrl.list);
router.get('/:id', requireAuth, ctrl.get);
router.post('/', requireAuth, ctrl.create);

module.exports = router;
