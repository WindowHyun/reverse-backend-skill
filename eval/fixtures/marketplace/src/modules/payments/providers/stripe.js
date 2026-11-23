const crypto = require('crypto');

exports.parse = (req) => {
  const given = req.get('stripe-signature') || '';
  const expected = crypto.createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET || '').update(JSON.stringify(req.body)).digest('hex');
  if (given.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    const err = new Error('bad signature');
    err.status = 401;
    throw err;
  }
  return { orderId: req.body.data.orderId };
};
