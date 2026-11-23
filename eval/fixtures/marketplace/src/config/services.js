module.exports = {
  billing: process.env.BILLING_URL || 'http://billing-svc:8080',
  warehouse: process.env.WAREHOUSE_URL || 'http://warehouse-svc:8080',
};
