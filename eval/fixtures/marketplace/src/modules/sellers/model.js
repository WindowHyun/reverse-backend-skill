const FIELDS = ['displayName', 'bankAccount', 'userId', 'balance'];
const HIDDEN = ['bankAccount'];

exports.toPublic = (item) => {
  const out = { id: item.id };
  for (const f of FIELDS) if (!HIDDEN.includes(f)) out[f] = item[f];
  return out;
};
