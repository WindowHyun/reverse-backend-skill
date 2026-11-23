module.exports = (req, res, next) => {
  res.set('access-control-allow-origin', req.get('origin') || '*');
  res.set('access-control-allow-credentials', 'true');
  res.set('access-control-allow-headers', 'authorization, content-type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
};
