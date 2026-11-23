const path = require('path');

module.exports = {
  port: process.env.PORT || 4000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev',
  uploadDir: path.join(__dirname, '..', '..', 'uploads'),
  pluginsDir: path.join(__dirname, '..', 'plugins'),
};
