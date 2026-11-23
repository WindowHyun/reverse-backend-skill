const Joi = require('joi');

const opts = { stripUnknown: true };
exports.create = Joi.object({
  message: Joi.string().required(),
  read: Joi.boolean()
}).options(opts);
exports.update = Joi.object({
  message: Joi.string(),
  read: Joi.boolean()
}).options(opts);

