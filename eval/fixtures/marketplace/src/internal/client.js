const axios = require('axios');
const services = require('../config/services');

// calls a sibling service; identity is forwarded in headers
exports.callService = async (name, path, body, user) => {
  const resp = await axios.post(`${services[name]}${path}`, body, {
    headers: { 'x-internal-call': process.env.INTERNAL_TOKEN, 'x-internal-user': user.id },
    timeout: 5000,
  });
  return resp.data;
};
