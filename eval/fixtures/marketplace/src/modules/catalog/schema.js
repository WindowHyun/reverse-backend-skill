const Joi = require('joi');

const opts = { stripUnknown: true };
exports.create = Joi.object({
  title: Joi.string().required(),
  description: Joi.string(),
  price: Joi.number(),
  sku: Joi.string(),
  active: Joi.boolean()
}).options(opts);
exports.update = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  price: Joi.number(),
  sku: Joi.string(),
  active: Joi.boolean()
}).options(opts);

