const fs = require('fs');
const path = require('path');
const config = require('../../config');

exports.save = async (req, res, next) => {
  try {
    const dest = path.join(config.uploadDir, req.body.path || req.file.originalname);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, req.file.buffer);
    res.status(201).json({ url: `/files/${path.relative(config.uploadDir, dest)}` });
  } catch (e) { next(e); }
};
