const service = require('./service');
const { toPublic } = require('./model');
const schema = require('./schema');
const validate = require('../../lib/validate');
const { paginate } = require('../../lib/pagination');

exports.me = async (req, res, next) => {
  try {
    const seller = await service.byUser(req.user.id);
    res.json(toPublic(seller));
  } catch (e) { next(e); }
};

exports.updateMe = async (req, res, next) => {
  try {
    const body = validate(schema.update, req.body);
    const seller = await service.byUser(req.user.id);
    Object.assign(seller, body);
    await service.save(seller);
    res.json(toPublic(seller));
  } catch (e) { next(e); }
};

exports.payout = async (req, res, next) => {
  try {
    const seller = await service.get(req.params.id);
    if (!seller) return res.status(404).json({ error: 'not found' });
    const result = await service.createPayout(seller);
    res.status(201).json(result);
  } catch (e) { next(e); }
};

exports.payouts = async (req, res, next) => {
  try {
    const seller = await service.get(req.params.id);
    if (!seller) return res.status(404).json({ error: 'not found' });
    if (seller.userId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    res.json(await service.payoutsFor(seller.id));
  } catch (e) { next(e); }
};
