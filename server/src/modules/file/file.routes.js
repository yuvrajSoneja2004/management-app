const express = require('express');
const { uploadFile } = require('./file.controller');
const { protect } = require('../../middleware/auth.middleware');
const upload = require('../../middleware/upload.middleware');
const { validateFileUpload } = require('../../middleware/validation.middleware');

const router = express.Router();

router.use(protect);

router.post('/upload/:taskId', validateFileUpload, upload.single('file'), uploadFile);

module.exports = router;
