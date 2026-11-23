const router = require('express').Router();
const multer = require('multer');
const ctrl = require('./controller');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('file'), ctrl.save);

module.exports = router;
