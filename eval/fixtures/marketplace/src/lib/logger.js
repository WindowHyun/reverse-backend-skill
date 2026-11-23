exports.info = (msg, meta = {}) => console.log(JSON.stringify({ level: 'info', msg, ...meta }));
exports.error = (msg, meta = {}) => console.error(JSON.stringify({ level: 'error', msg, ...meta }));
