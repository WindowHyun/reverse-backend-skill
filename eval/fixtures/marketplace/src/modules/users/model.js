const FIELDS = ['email', 'name', 'passwordHash', 'role', 'resetToken', 'isVerified', 'phone'];
const HIDDEN = ['passwordHash', 'resetToken'];

exports.toPublic = (item) => {
  const out = { id: item.id };
  for (const f of FIELDS) if (!HIDDEN.includes(f)) out[f] = item[f];
  return out;
};
