const db = require('../../lib/db');

module.exports = {
  me: (args, ctx) => (ctx.user ? db.findOne('users', { id: ctx.user.id }) : null),
  user: ({ id }) => db.findOne('users', { id }),
  updateUser: ({ id, input }) => db.update('users', id, input),
};
