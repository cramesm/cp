const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const TORController = require('../controllers/torController');
const { auth, superAdminOnly, registrarOrSuperAdmin } = require('../middleware/authMiddleware');

// Configure multer for CSV uploads
const csvStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'tor');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `csv-${Date.now()}-${file.originalname}`);
    }
});

const uploadCSV = multer({
    storage: csvStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});

// @route   POST /api/tor/upload-csv
router.post('/upload-csv', auth, registrarOrSuperAdmin, uploadCSV.single('csvFile'), TORController.uploadCSV);

// @route   GET /api/tor
router.get('/', auth, registrarOrSuperAdmin, TORController.getAllTOR);

// @route   GET /api/tor/:id
router.get('/:id', auth, registrarOrSuperAdmin, TORController.getTORById);

// @route   PUT /api/tor/:id
router.put('/:id', auth, registrarOrSuperAdmin, TORController.updateTOR);

// @route   POST /api/tor/:id/generate
router.post('/:id/generate', auth, registrarOrSuperAdmin, TORController.generateTOR);

// @route   GET /api/tor/:id/download
router.get('/:id/download', auth, registrarOrSuperAdmin, TORController.downloadTOR);

// @route   DELETE /api/tor/:id
router.delete('/:id', auth, superAdminOnly, TORController.deleteTOR);

module.exports = router;
