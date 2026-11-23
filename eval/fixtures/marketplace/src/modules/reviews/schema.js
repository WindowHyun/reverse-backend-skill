const Joi = require('joi');

const opts = { stripUnknown: true };
exports.create = Joi.object({
  productId: Joi.string().required(),
  rating: Joi.number(),
  body: Joi.string()
}).options(opts);
exports.update = Joi.object({
  productId: Joi.string(),
  rating: Joi.number(),
  body: Joi.string()
}).options(opts);

