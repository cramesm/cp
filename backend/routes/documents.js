const express = require('express');
const router = express.Router();
const multer = require('multer');
const DocumentController = require('../controllers/documentController');
const { auth, superAdminOnly, registrarOrSuperAdmin } = require('../middleware/authMiddleware');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// @route   GET /api/documents
router.get('/', auth, registrarOrSuperAdmin, DocumentController.getAllDocuments);

// @route   GET /api/documents/:id
router.get('/:id', auth, registrarOrSuperAdmin, DocumentController.getDocumentById);

// @route   POST /api/documents
router.post('/', auth, registrarOrSuperAdmin, upload.single('pdfFile'), DocumentController.createDocument);

// @route   PUT /api/documents/:id
router.put('/:id', auth, registrarOrSuperAdmin, upload.single('pdfFile'), DocumentController.updateDocument);

// @route   POST /api/documents/:id/finalize
router.post('/:id/finalize', auth, registrarOrSuperAdmin, DocumentController.finalizeDocument);

// @route   POST /api/documents/:id/generate-hash
router.post('/:id/generate-hash', auth, registrarOrSuperAdmin, DocumentController.generateHash);

// @route   DELETE /api/documents/:id
router.delete('/:id', auth, superAdminOnly, DocumentController.deleteDocument);

// @route   GET /api/documents/:id/download
router.get('/:id/download', auth, registrarOrSuperAdmin, DocumentController.downloadDocument);

module.exports = router;
