const db = require('../../lib/db');

const T = 'coupons';
const OWNER = '';

exports.list = (filter, opts) => db.find(T, filter.owner && OWNER ? { [OWNER]: filter.owner } : {}, opts);
exports.get = (id) => db.findOne(T, { id });
exports.create = (data) => db.insert(T, data);
exports.save = (item) => db.update(T, item.id, item);
exports.remove = (id) => db.remove(T, id);
exports.byCode = (code) => db.findOne(T, { code });
exports.orderFor = (id) => db.findOne('orders', { id });
exports.saveOrder = (order) => db.update('orders', order.id, order);
