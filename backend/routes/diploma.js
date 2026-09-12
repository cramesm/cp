const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const DiplomaController = require('../controllers/diplomaController');
const { auth, superAdminOnly, registrarOrSuperAdmin } = require('../middleware/authMiddleware');

// Configure multer for CSV uploads
const csvStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'diploma');
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

// @route   POST /api/diploma/upload-csv
router.post('/upload-csv', auth, registrarOrSuperAdmin, uploadCSV.single('csvFile'), DiplomaController.uploadCSV);

// @route   GET /api/diploma
router.get('/', auth, registrarOrSuperAdmin, DiplomaController.getAllDiplomas);

// @route   GET /api/diploma/:id
router.get('/:id', auth, registrarOrSuperAdmin, DiplomaController.getDiplomaById);

// @route   PUT /api/diploma/:id
router.put('/:id', auth, registrarOrSuperAdmin, DiplomaController.updateDiploma);

// @route   POST /api/diploma/:id/generate
router.post('/:id/generate', auth, registrarOrSuperAdmin, DiplomaController.generateDiploma);

// @route   GET /api/diploma/:id/download
router.get('/:id/download', auth, registrarOrSuperAdmin, DiplomaController.downloadDiploma);

// @route   DELETE /api/diploma/:id
router.delete('/:id', auth, superAdminOnly, DiplomaController.deleteDiploma);

module.exports = router;
