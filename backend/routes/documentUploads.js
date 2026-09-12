const express = require('express');
const router = express.Router();
const multer = require('multer');
const RequestController = require('../controllers/requestController');
const { auth } = require('../middleware/authMiddleware');

// Configure multer for memory storage (Serverless/Vercel compatible)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// @route   POST /api/requests/:id/upload
router.post('/:id/upload', auth, upload.single('document'), RequestController.uploadDocumentFile);

module.exports = router;
