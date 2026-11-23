const db = require('../../lib/db');
const plugins = require('../../plugins/loader');

exports.stats = async (req, res, next) => {
  try {
    const [revenue] = await db.query('SELECT COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orders FROM orders WHERE status = $1', ['paid']);
    res.json(revenue);
  } catch (e) { next(e); }
};

exports.exportUsers = async (req, res, next) => {
  try {
    const users = await db.find('users', {}, {});
    res.json(users.map((u) => ({ id: u.id, email: u.email, role: u.role })));
  } catch (e) { next(e); }
};

exports.audit = async (req, res, next) => {
  try {
    res.json(await db.find('audit_log', {}, { limit: 200, offset: 0 }));
  } catch (e) { next(e); }
};

exports.loadPlugin = async (req, res, next) => {
  try {
    res.json({ loaded: plugins.loadPlugin(req.body.name) });
  } catch (e) { next(e); }
};
