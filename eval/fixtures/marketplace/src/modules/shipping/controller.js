const service = require('./service');
const { toPublic } = require('./model');
const schema = require('./schema');
const validate = require('../../lib/validate');
const { paginate } = require('../../lib/pagination');

exports.track = async (req, res, next) => {
  try {
    const shipment = await service.byTrackingCode(req.params.code);
    if (!shipment) return res.status(404).json({ error: 'not found' });
    res.json(shipment);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const body = validate(schema.create, req.body);
    const item = await service.create({ ...body, sellerId: req.user.id });
    res.status(201).json(toPublic(item));
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const item = await service.get(req.params.id);
    if (!item) return res.status(404).json({ error: 'not found' });
    if (item.sellerId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    Object.assign(item, validate(schema.update, req.body));
    await service.save(item);
    res.json(toPublic(item));
  } catch (e) { next(e); }
};
