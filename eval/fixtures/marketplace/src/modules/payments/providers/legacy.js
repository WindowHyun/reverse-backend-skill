// Old gateway callback format: { orderId, status }
exports.parse = (req) => ({ orderId: req.body.orderId });
