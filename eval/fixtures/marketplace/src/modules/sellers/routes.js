const router = require('express').Router();
const ctrl = require('./controller');
const { requireAuth, requireRole } = require('../../lib/auth');

router.get('/me', requireRole('seller'), ctrl.me);
router.put('/me', requireRole('seller'), ctrl.updateMe);
router.post('/:id/payout', requireRole('seller'), ctrl.payout);
router.get('/:id/payouts', requireRole('seller'), ctrl.payouts);

module.exports = router;
