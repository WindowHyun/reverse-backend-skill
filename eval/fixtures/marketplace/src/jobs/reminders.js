const db = require('../lib/db');

exports.abandonedCarts = async () => {
  const rows = await db.query("SELECT DISTINCT \"userId\" FROM cart_items WHERE created_at < now() - interval '1 day'");
  for (const r of rows) await db.insert('notifications', { userId: r.userId, message: 'You left items in your cart', read: false });
};
