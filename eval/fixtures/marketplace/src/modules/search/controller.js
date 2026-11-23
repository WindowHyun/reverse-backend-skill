const db = require('../../lib/db');

exports.search = async (req, res, next) => {
  try {
    const q = String(req.query.q || '');
    const sort = req.query.sort || 'id';
    const rows = await db.query(
      `SELECT id, title, price FROM products WHERE active = true AND title ILIKE $1 ORDER BY ${sort} LIMIT 50`,
      [`%${q}%`],
    );
    res.json(rows);
  } catch (e) { next(e); }
};
