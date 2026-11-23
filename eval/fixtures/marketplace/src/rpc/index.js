const router = require('express').Router();
const { requireAuth } = require('../lib/auth');
const handlers = require('./handlers');

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const fn = handlers[req.body.action];
    if (!fn) return res.status(404).json({ error: 'unknown action' });
    res.json(await fn(req.user, req.body.params || {}));
  } catch (e) { next(e); }
});

module.exports = router;
