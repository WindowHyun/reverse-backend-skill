const service = require('./service');
const { toPublic } = require('./model');
const schema = require('./schema');
const validate = require('../../lib/validate');
const { paginate } = require('../../lib/pagination');

exports.byCode = async (req, res, next) => {
  try {
    const coupon = await service.byCode(req.params.code);
    if (!coupon || !coupon.active) return res.status(404).json({ error: 'not found' });
    res.json(toPublic(coupon));
  } catch (e) { next(e); }
};

exports.apply = async (req, res, next) => {
  try {
    const { code, orderId } = req.body;
    const coupon = await service.byCode(code);
    if (!coupon || !coupon.active) return res.status(404).json({ error: 'invalid coupon' });
    const order = await service.orderFor(orderId);
    order.total = order.total * (100 - coupon.percent) / 100;
    await service.saveOrder(order);
    res.json({ total: order.total });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const body = validate(schema.create, req.body);
    const item = await service.create({ ...body });
    res.status(201).json(toPublic(item));
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await service.get(req.params.id);
    if (!item) return res.status(404).json({ error: 'not found' });
    await service.remove(req.params.id);
    res.status(204).end();
  } catch (e) { next(e); }
};
