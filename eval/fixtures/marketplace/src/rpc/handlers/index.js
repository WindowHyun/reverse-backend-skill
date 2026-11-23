const fs = require('fs');

// every sibling file exports { 'namespace.action': handler }
const handlers = {};
for (const file of fs.readdirSync(__dirname)) {
  if (file === 'index.js') continue;
  Object.assign(handlers, require(`./${file}`));
}
module.exports = handlers;
