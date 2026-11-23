const db = require('../../lib/db');

module.exports = {
  addReview: ({ productId, rating, body }, ctx) => db.insert('reviews', { productId, rating, body, userId: ctx.user.id }),
};
