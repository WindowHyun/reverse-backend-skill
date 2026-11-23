const router = require('express').Router();
const ctrl = require('./controller');
const { requireRole } = require('../../lib/auth');

router.get('/stats', ctrl.stats);

router.use(requireRole('admin'));

router.get('/users/export', ctrl.exportUsers);
router.get('/audit', ctrl.audit);
router.post('/plugins/load', ctrl.loadPlugin);
// router.delete('/users/:id', ctrl.hardDelete);   // removed in v2

module.exports = router;
