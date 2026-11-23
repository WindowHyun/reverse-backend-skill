const db = require('../../lib/db');

module.exports = {
  'orders.get': async (user, { id }) => {
    const order = await db.findOne('orders', { id });
    if (!order || (order.buyerId !== user.id && user.role !== 'admin')) throw Object.assign(new Error('forbidden'), { status: 403 });
    return order;
  },
  'orders.cancel': async (user, { id }) => {
    const order = await db.findOne('orders', { id });
    if (!order || order.buyerId !== user.id) throw Object.assign(new Error('forbidden'), { status: 403 });
    return db.update('orders', id, { status: 'cancelled' });
  },
};
