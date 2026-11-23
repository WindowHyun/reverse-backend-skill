const Joi = require('joi');

const opts = { stripUnknown: true };
exports.create = Joi.object({
  orderId: Joi.string().required(),
  trackingCode: Joi.string(),
  carrier: Joi.string(),
  recipientName: Joi.string(),
  address: Joi.string()
}).options(opts);
exports.update = Joi.object({
  orderId: Joi.string(),
  trackingCode: Joi.string(),
  carrier: Joi.string(),
  recipientName: Joi.string(),
  address: Joi.string()
}).options(opts);

