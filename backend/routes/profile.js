const express = require('express');
const router = express.Router();
const multer = require('multer');
const ProfileController = require('../controllers/profileController');
const { auth } = require('../middleware/authMiddleware');

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// @route   GET /api/profile
router.get('/', auth, ProfileController.getProfile);

// @route   PUT /api/profile
router.put('/', auth, ProfileController.updateProfile);

// @route   POST /api/profile/upload-photo
router.post('/upload-photo', auth, upload.single('image'), ProfileController.uploadPhoto);

module.exports = router;
