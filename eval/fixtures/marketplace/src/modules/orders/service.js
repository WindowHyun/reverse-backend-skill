const db = require('../../lib/db');

const T = 'orders';
const OWNER = 'buyerId';

exports.list = (filter, opts) => db.find(T, filter.owner && OWNER ? { [OWNER]: filter.owner } : {}, opts);
exports.get = (id) => db.findOne(T, { id });
exports.create = (data) => db.insert(T, data);
exports.save = (item) => db.update(T, item.id, item);
exports.remove = (id) => db.remove(T, id);
exports.priceItems = async (items) => {
  const out = [];
  for (const i of items) {
    const p = await db.findOne('products', { sku: i.sku });
    out.push({ sku: i.sku, qty: i.qty, unitPrice: p.price });
  }
  return out;
};
