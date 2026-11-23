const router = require('express').Router();
const ctrl = require('./controller');
const { requireAuth, requireRole } = require('../../lib/auth');

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', requireRole('seller'), ctrl.create);
router.put('/:id', requireRole('seller'), ctrl.update);
router.delete('/:id', requireRole('seller'), ctrl.remove);

module.exports = router;
