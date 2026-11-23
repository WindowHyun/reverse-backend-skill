const router = require('express').Router();
const ctrl = require('./controller');
const { requireAuth, requireRole } = require('../../lib/auth');

router.get('/', requireAuth, ctrl.list);
router.post('/:id/read', requireAuth, ctrl.markRead);
router.post('/webhook-test', requireAuth, ctrl.webhookTest);

module.exports = router;
