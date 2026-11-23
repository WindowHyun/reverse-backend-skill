const db = require('../lib/db');

exports.dailyRevenue = () => db.query("INSERT INTO daily_revenue SELECT now()::date, SUM(total) FROM orders WHERE status = 'paid'");
