module.exports = (schema, payload) => {
  const { value, error } = schema.validate(payload);
  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
  return value;
};
