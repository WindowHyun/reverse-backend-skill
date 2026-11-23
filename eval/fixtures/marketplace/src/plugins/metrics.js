const counters = {};

module.exports = { inc: (name) => { counters[name] = (counters[name] || 0) + 1; }, snapshot: () => ({ ...counters }) };
