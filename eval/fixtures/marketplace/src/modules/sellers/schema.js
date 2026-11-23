const Joi = require('joi');

const opts = { stripUnknown: true };
exports.create = Joi.object({
  displayName: Joi.string().required()
}).options(opts);
exports.update = Joi.object({
  displayName: Joi.string()
}).options(opts);

