const cron = require('node-cron');
const cleanup = require('./cleanup');
const reminders = require('./reminders');
const reports = require('./reports');

cron.schedule('0 * * * *', cleanup.expireCarts);
cron.schedule('*/15 * * * *', reminders.abandonedCarts);
cron.schedule('0 3 * * *', reports.dailyRevenue);
