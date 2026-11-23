const service = require('./service');
const { toPublic } = require('./model');
const schema = require('./schema');
const validate = require('../../lib/validate');
const { paginate } = require('../../lib/pagination');

exports.create = async (req, res, next) => {
  try {
    const body = validate(schema.create, req.body);
    const item = await service.create({ ...body, userId: req.user.id });
    res.status(201).json(toPublic(item));
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const item = await service.get(req.params.id);
    if (!item) return res.status(404).json({ error: 'not found' });
    if (item.userId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    res.json(toPublic(item));
  } catch (e) { next(e); }
};

const providers = {
  stripe: require('./providers/stripe'),
  paypal: require('./providers/paypal'),
  legacy: require('./providers/legacy'),
};

exports.webhook = async (req, res, next) => {
  try {
    const provider = providers[req.params.provider];
    if (!provider) return res.status(404).json({ error: 'unknown provider' });
    const event = provider.parse(req);
    await service.markPaid(event.orderId);
    res.json({ ok: true });
  } catch (e) { next(e); }
};
