const Joi = require('joi');

const opts = { stripUnknown: true };
exports.create = Joi.object({
  code: Joi.string().required(),
  percent: Joi.number(),
  active: Joi.boolean()
}).options(opts);
exports.update = Joi.object({
  code: Joi.string(),
  percent: Joi.number(),
  active: Joi.boolean()
}).options(opts);

