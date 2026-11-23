const service = require('./service');
const { toPublic } = require('./model');
const schema = require('./schema');
const validate = require('../../lib/validate');
const { paginate } = require('../../lib/pagination');

exports.list = async (req, res, next) => {
  try {
    const { limit, offset } = paginate(req.query);
    const rows = await service.list({}, { limit, offset });
    res.json(rows.map(toPublic));
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const body = validate(schema.create, req.body);
    const item = await service.create({ ...body, userId: req.user.id });
    res.status(201).json(toPublic(item));
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const item = await service.get(req.params.id);
    if (!item) return res.status(404).json({ error: 'not found' });
    if (item.userId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    Object.assign(item, validate(schema.update, req.body));
    await service.save(item);
    res.json(toPublic(item));
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
