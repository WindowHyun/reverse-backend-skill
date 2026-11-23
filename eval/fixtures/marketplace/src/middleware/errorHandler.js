const logger = require('../lib/logger');

module.exports = (err, req, res, next) => {
  logger.error('unhandled', { id: req.id, message: err.message });
  res.status(err.status || 500).json({ error: err.message, stack: err.stack });
};
