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

exports.get = async (req, res, next) => {
  try {
    const item = await service.get(req.params.id);
    if (!item) return res.status(404).json({ error: 'not found' });
    res.json(toPublic(item));
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const body = req.body;
    const item = await service.create({ ...body, buyerId: req.user.id });
    res.status(201).json(toPublic(item));
  } catch (e) { next(e); }
};
