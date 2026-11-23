const hits = new Map();

// fixed-window limiter: 100 requests / minute / ip
module.exports = (req, res, next) => {
  const key = req.ip;
  const now = Date.now();
  const entry = hits.get(key) || { count: 0, reset: now + 60000 };
  if (entry.reset < now) { entry.count = 0; entry.reset = now + 60000; }
  entry.count += 1;
  hits.set(key, entry);
  if (entry.count > 100) return res.status(429).json({ error: 'too many requests' });
  next();
};
