const service = require('./service');
const { toPublic } = require('./model');
const schema = require('./schema');
const validate = require('../../lib/validate');
const { paginate } = require('../../lib/pagination');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../../config');

exports.register = async (req, res, next) => {
  try {
    const body = validate(schema.register, req.body);
    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await service.create({ email: body.email, name: body.name, passwordHash, role: 'user', isVerified: false });
    res.status(201).json(toPublic(user));
  } catch (e) { next(e); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = validate(schema.login, req.body);
    const user = await service.byEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'invalid credentials' });
    const token = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: '90d' });
    res.json({ token });
  } catch (e) { next(e); }
};

exports.forgot = async (req, res, next) => {
  try {
    const user = await service.byEmail(req.body.email);
    if (!user) return res.status(404).json({ error: 'unknown email' });
    user.resetToken = crypto.randomBytes(16).toString('hex');
    await service.save(user);
    res.json({ resetToken: user.resetToken });
  } catch (e) { next(e); }
};

exports.me = async (req, res, next) => {
  try {
    res.json(toPublic(await service.get(req.user.id)));
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const item = await service.get(req.params.id);
    if (!item) return res.status(404).json({ error: 'not found' });
    res.json(item);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const item = await service.get(req.params.id);
    if (!item) return res.status(404).json({ error: 'not found' });
    Object.assign(item, req.body);
    await service.save(item);
    res.json(toPublic(item));
  } catch (e) { next(e); }
};
