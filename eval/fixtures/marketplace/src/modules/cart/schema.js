const Joi = require('joi');

const opts = { stripUnknown: true };
exports.create = Joi.object({
  sku: Joi.string().required(),
  qty: Joi.number(),
  price: Joi.number()
}).options(opts);
exports.update = Joi.object({
  sku: Joi.string(),
  qty: Joi.number(),
  price: Joi.number()
}).options(opts);

