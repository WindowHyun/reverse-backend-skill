const logger = require('../lib/logger');

module.exports = (req, res, next) => {
  logger.info('request', { id: req.id, method: req.method, url: req.originalUrl, headers: req.headers });
  next();
};
