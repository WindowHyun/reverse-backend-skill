const Joi = require('joi');

const opts = { stripUnknown: true };
exports.create = Joi.object({
  name: Joi.string().required(),
  slug: Joi.string(),
  parentId: Joi.string()
}).options(opts);
exports.update = Joi.object({
  name: Joi.string(),
  slug: Joi.string(),
  parentId: Joi.string()
}).options(opts);

