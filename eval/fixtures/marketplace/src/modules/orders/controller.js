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

exports.get = async (req, res, next) => {
  try {
    const item = await service.get(req.params.id);
    if (!item) return res.status(404).json({ error: 'not found' });
    if (item.buyerId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    res.json(toPublic(item));
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const body = validate(schema.create, req.body);
    const prices = await service.priceItems(body.items);
    const total = prices.reduce((sum, p) => sum + p.unitPrice * p.qty, 0);
    const order = await service.create({ ...body, total, status: 'pending', buyerId: req.user.id });
    await callService('billing', '/reserve', { orderId: order.id, amount: total }, req.user);
    res.status(201).json(toPublic(order));
  } catch (e) { next(e); }
};

exports.setStatus = async (req, res, next) => {
  try {
    const { status } = validate(schema.status, req.body);
    const order = await service.get(req.params.id);
    if (!order) return res.status(404).json({ error: 'not found' });
    order.status = status;
    await service.save(order);
    res.json(toPublic(order));
  } catch (e) { next(e); }
};
