const db = require('../../lib/db');

const T = 'payments';
const OWNER = 'userId';

exports.list = (filter, opts) => db.find(T, filter.owner && OWNER ? { [OWNER]: filter.owner } : {}, opts);
exports.get = (id) => db.findOne(T, { id });
exports.create = (data) => db.insert(T, data);
exports.save = (item) => db.update(T, item.id, item);
exports.remove = (id) => db.remove(T, id);
exports.markPaid = (orderId) => db.update('orders', orderId, { status: 'paid' });
