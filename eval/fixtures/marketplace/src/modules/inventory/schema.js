const Joi = require('joi');

const opts = { stripUnknown: true };
exports.create = Joi.object({
  sku: Joi.string().required(),
  quantity: Joi.number(),
  warehouse: Joi.string()
}).options(opts);
exports.update = Joi.object({
  sku: Joi.string(),
  quantity: Joi.number(),
  warehouse: Joi.string()
}).options(opts);

