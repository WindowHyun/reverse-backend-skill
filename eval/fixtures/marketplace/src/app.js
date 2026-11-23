const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { authenticate, requireAuth } = require('./lib/auth');
const requestId = require('./middleware/requestId');
const cors = require('./middleware/cors');
const logging = require('./middleware/logging');
const errorHandler = require('./middleware/errorHandler');
const graphql = require('./graphql');
const rpc = require('./rpc');
const plugins = require('./plugins/loader');

const app = express();
app.use(requestId);
app.use(cors);
app.use(express.json());
app.use(logging);
app.use(authenticate);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// every directory under src/modules is a feature module: { mount, version, public, router }
const modulesDir = path.join(__dirname, 'modules');
for (const name of fs.readdirSync(modulesDir)) {
  const meta = require(path.join(modulesDir, name));
  const base = `/api/v${meta.version}/${meta.mount}`;
  app.use(base, ...(meta.public ? [] : [requireAuth]), meta.router);
}

app.use('/files', express.static(config.uploadDir));
app.use('/graphql', graphql);
app.use('/rpc', rpc);

plugins.loadAll();
app.use(errorHandler);

module.exports = app;
