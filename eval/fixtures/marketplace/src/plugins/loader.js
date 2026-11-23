const fs = require('fs');
const path = require('path');
const config = require('../config');

const loaded = {};

exports.loadPlugin = (name) => {
  const file = path.join(config.pluginsDir, name);
  loaded[name] = require(file);
  return name;
};

exports.loadAll = () => {
  for (const f of fs.readdirSync(config.pluginsDir)) {
    if (f === 'loader.js') continue;
    exports.loadPlugin(f);
  }
};
