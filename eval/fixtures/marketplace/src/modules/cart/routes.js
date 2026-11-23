const router = require('express').Router();
const ctrl = require('./controller');
const { requireAuth, requireRole } = require('../../lib/auth');
const cache = require('../../lib/cache');

router.get('/', requireAuth, cache(), ctrl.list);
router.post('/items', requireAuth, ctrl.addItem);
router.delete('/items/:id', requireAuth, ctrl.remove);
router.post('/checkout', requireAuth, ctrl.checkout);

module.exports = router;
