const db = require('../../lib/db');

module.exports = {
  'catalog.get': (user, { id }) => db.findOne('products', { id }),
};
