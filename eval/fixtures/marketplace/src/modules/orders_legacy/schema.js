const Joi = require('joi');

const opts = { stripUnknown: true };
exports.create = Joi.object({
  items: Joi.array().required(),
  total: Joi.number(),
  status: Joi.string()
}).options(opts);
exports.update = Joi.object({
  items: Joi.array(),
  total: Joi.number(),
  status: Joi.string()
}).options(opts);

