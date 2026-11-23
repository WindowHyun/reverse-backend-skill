const router = require('express').Router();
const ctrl = require('./controller');
const { requireAuth, requireRole } = require('../../lib/auth');
const cache = require('../../lib/cache');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/forgot', ctrl.forgot);
router.get('/me', requireAuth, cache(), ctrl.me);
router.get('/:id', requireAuth, ctrl.get);
router.put('/:id', requireAuth, ctrl.update);

module.exports = router;
