const db = require('../../lib/db');

module.exports = {
  orders: (args, ctx) => db.find('orders', { buyerId: ctx.user.id }),
  order: async ({ id }, ctx) => {
    const order = await db.findOne('orders', { id });
    return order && order.buyerId === ctx.user.id ? order : null;
  },
  allOrders: () => db.find('orders', {}, { limit: 1000 }),
  createOrder: ({ items }, ctx) => db.insert('orders', { buyerId: ctx.user.id, items: JSON.stringify(items), total: 0, status: 'pending' }),
  cancelOrder: async ({ id }, ctx) => {
    const order = await db.findOne('orders', { id });
    if (!order || order.buyerId !== ctx.user.id) return null;
    return db.update('orders', id, { status: 'cancelled' });
  },
};
