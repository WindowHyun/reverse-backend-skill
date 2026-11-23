const router = require('express').Router();
const ctrl = require('./controller');
const { requireAuth, requireRole } = require('../../lib/auth');

router.get('/track/:code', ctrl.track);
router.post('/', requireRole('seller'), ctrl.create);
router.put('/:id', requireRole('seller'), ctrl.update);

module.exports = router;
