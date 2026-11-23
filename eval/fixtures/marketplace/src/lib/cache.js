const store = new Map();

// short-lived response cache for expensive GETs
module.exports = (ttlMs = 30000) => (req, res, next) => {
  const key = req.originalUrl;
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return res.json(hit.body);
  const json = res.json.bind(res);
  res.json = (body) => {
    store.set(key, { body, expires: Date.now() + ttlMs });
    return json(body);
  };
  next();
};
