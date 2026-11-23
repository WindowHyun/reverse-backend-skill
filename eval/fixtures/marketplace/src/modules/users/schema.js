const Joi = require('joi');

const opts = { stripUnknown: true };
exports.create = Joi.object({
  email: Joi.string().required(),
  name: Joi.string(),
  phone: Joi.string()
}).options(opts);
exports.update = Joi.object({
  email: Joi.string(),
  name: Joi.string(),
  phone: Joi.string()
}).options(opts);
exports.register = Joi.object({ email: Joi.string().email().required(), name: Joi.string().required(), password: Joi.string().min(8).required() });
exports.login = Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() });
