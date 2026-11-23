const db = require('../../lib/db');

module.exports = {
  // admin console action
  'users.setRole': (user, { id, role }) => db.update('users', id, { role }),
};
