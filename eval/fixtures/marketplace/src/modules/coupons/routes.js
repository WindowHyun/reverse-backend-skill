const router = require('express').Router();
const ctrl = require('./controller');
const { requireAuth, requireRole } = require('../../lib/auth');

router.get('/:code', requireAuth, ctrl.byCode);
router.post('/apply', requireAuth, ctrl.apply);
router.post('/', requireRole('admin'), ctrl.create);
router.delete('/:id', requireRole('admin'), ctrl.remove);

module.exports = router;
