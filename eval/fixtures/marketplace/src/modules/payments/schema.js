const Joi = require('joi');

const opts = { stripUnknown: true };
exports.create = Joi.object({
  orderId: Joi.string().required(),
  amount: Joi.number(),
  status: Joi.string()
}).options(opts);
exports.update = Joi.object({
  orderId: Joi.string(),
  amount: Joi.number(),
  status: Joi.string()
}).options(opts);

