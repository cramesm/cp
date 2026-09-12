const express = require('express');
const router = express.Router();
const multer = require('multer');
const UploadController = require('../controllers/uploadController');
const { auth } = require('../middleware/authMiddleware');

// Configure multer for memory storage (Serverless/Vercel compatible)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// @route   POST /api/upload/image
router.post('/image', auth, upload.single('image'), UploadController.uploadImage);

module.exports = router;
