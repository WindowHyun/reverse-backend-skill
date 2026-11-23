const FIELDS = ['items', 'total', 'status', 'buyerId', 'shippingAddress'];
const HIDDEN = [];

exports.toPublic = (item) => {
  const out = { id: item.id };
  for (const f of FIELDS) if (!HIDDEN.includes(f)) out[f] = item[f];
  return out;
};
