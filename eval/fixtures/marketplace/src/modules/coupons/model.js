const FIELDS = ['code', 'percent', 'active', 'usedBy'];
const HIDDEN = ['usedBy'];

exports.toPublic = (item) => {
  const out = { id: item.id };
  for (const f of FIELDS) if (!HIDDEN.includes(f)) out[f] = item[f];
  return out;
};
