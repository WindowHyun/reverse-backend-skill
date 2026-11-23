const service = require('./service');
const { toPublic } = require('./model');
const schema = require('./schema');
const validate = require('../../lib/validate');
const { paginate } = require('../../lib/pagination');
const { callService } = require('../../internal/client');

exports.list = async (req, res, next) => {
  try {
    const { limit, offset } = paginate(req.query);
    const rows = await service.list({ owner: req.user.id }, { limit, offset });
    res.json(rows.map(toPublic));
  } catch (e) { next(e); }
};

exports.addItem = async (req, res, next) => {
  try {
    const { sku, qty, price } = req.body;
    const item = await service.create({ sku, qty, price, userId: req.user.id });
    res.status(201).json(toPublic(item));
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await service.get(req.params.id);
    if (!item) return res.status(404).json({ error: 'not found' });
    if (item.userId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    await service.remove(req.params.id);
    res.status(204).end();
  } catch (e) { next(e); }
};

exports.checkout = async (req, res, next) => {
  try {
    const items = await service.list({ owner: req.user.id }, {});
    const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const charge = await callService('billing', '/charge', { userId: req.user.id, amount: total }, req.user);
    res.json({ total, chargeId: charge.id });
  } catch (e) { next(e); }
};
