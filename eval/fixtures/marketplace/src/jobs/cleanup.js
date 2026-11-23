const db = require('../lib/db');

exports.expireCarts = () => db.query("DELETE FROM cart_items WHERE created_at < now() - interval '7 days'");
