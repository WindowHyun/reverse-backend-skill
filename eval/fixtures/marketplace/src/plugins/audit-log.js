const db = require('../lib/db');

module.exports = { record: (actor, action) => db.insert('audit_log', { actor, action }) };
