const router = require('express').Router();
const ctrl = require('./controller');
const { requireAuth, requireRole } = require('../../lib/auth');

router.get('/', ctrl.list);
router.post('/', requireAuth, ctrl.create);
router.put('/:id', requireAuth, ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
