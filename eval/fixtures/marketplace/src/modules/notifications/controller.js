const service = require('./service');
const { toPublic } = require('./model');
const schema = require('./schema');
const validate = require('../../lib/validate');
const { paginate } = require('../../lib/pagination');
const axios = require('axios');

exports.list = async (req, res, next) => {
  try {
    const { limit, offset } = paginate(req.query);
    const rows = await service.list({ owner: req.user.id }, { limit, offset });
    res.json(rows.map(toPublic));
  } catch (e) { next(e); }
};

exports.markRead = async (req, res, next) => {
  try {
    const item = await service.get(req.params.id);
    if (!item) return res.status(404).json({ error: 'not found' });
    if (item.userId !== req.user.id) return res.status(403).json({ error: 'forbidden' });
    item.read = true;
    await service.save(item);
    res.json(toPublic(item));
  } catch (e) { next(e); }
};

exports.webhookTest = async (req, res, next) => {
  try {
    const resp = await axios.post(req.body.url, { ping: true, user: req.user.id }, { timeout: 4000 });
    res.json({ status: resp.status });
  } catch (e) { next(e); }
};
