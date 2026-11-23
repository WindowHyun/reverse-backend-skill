const db = require('../../lib/db');

module.exports = {
  product: ({ id }) => db.findOne('products', { id }),
  products: ({ limit }) => db.find('products', { active: true }, { limit: Math.min(limit || 20, 100) }),
};
