const crypto = require('crypto');

exports.parse = (req) => {
  const given = req.get('paypal-transmission-sig') || '';
  const expected = crypto.createHmac('sha256', process.env.PAYPAL_WEBHOOK_SECRET || '').update(JSON.stringify(req.body)).digest('base64');
  if (given.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    const err = new Error('bad signature');
    err.status = 401;
    throw err;
  }
  return { orderId: req.body.resource.custom_id };
};
