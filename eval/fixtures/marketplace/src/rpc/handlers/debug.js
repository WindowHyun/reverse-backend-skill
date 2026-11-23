const db = require('../../lib/db');

module.exports = {
  'debug.exportTable': (user, { table }) => db.query(`SELECT * FROM ${table} LIMIT 1000`),
};
