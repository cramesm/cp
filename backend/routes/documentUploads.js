const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { PDFDocument } = require('pdf-lib');
const { protect } = require('../middleware/authMiddleware');
const Request = require('../models/Request');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'uploads', 'documents');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

router.post('/:id/upload', protect, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const requestId = req.params.id;
        const request = await Request.findOne({ requestId: requestId });

        if (!request) {
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: 'Request not found' });
        }

        const docType = (request.documentType || request.document_type || '').toLowerCase();
        const isBlockchainEligible = docType.includes('transcript') || docType.includes('tor') || docType.includes('diploma');

        let finalPath = `/uploads/documents/${req.file.filename}`;
        let documentHash = request.documentHash;

        if (isBlockchainEligible) {
            // Generate hash if not exists
            if (!documentHash) {
                documentHash = crypto.createHash('sha256')
                    .update(`${request.requestId}-${request.name}-${Date.now()}`)
                    .digest('hex');
                request.documentHash = documentHash;
            }

            // Generate QR Code
            const validationUrl = `${FRONTEND_URL}/validation?ref=${documentHash}`;
            const qrCodeBuffer = await QRCode.toBuffer(validationUrl, {
                errorCorrectionLevel: 'H',
                margin: 1,
                width: 150
            });

            // Read the uploaded PDF
            const existingPdfBytes = fs.readFileSync(req.file.path);
            const pdfDoc = await PDFDocument.load(existingPdfBytes);

            // Embed QR Code
            const qrImage = await pdfDoc.embedPng(qrCodeBuffer);
            const qrDims = qrImage.scale(1);

            // Draw on the first page
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];
            const { width, height } = firstPage.getSize();

            // Place in the bottom right corner (with some padding)
            const padding = 30;
            firstPage.drawImage(qrImage, {
                x: width - qrDims.width - padding,
                y: padding,
                width: qrDims.width,
                height: qrDims.height,
            });

            // Save modified PDF
            const modifiedPdfBytes = await pdfDoc.save();
            const newFilename = `qr-${req.file.filename}`;
            const newFilePath = path.join(__dirname, '..', 'uploads', 'documents', newFilename);
            
            fs.writeFileSync(newFilePath, modifiedPdfBytes);
            
            // Delete original file
            fs.unlinkSync(req.file.path);

            finalPath = `/uploads/documents/${newFilename}`;
        }

        request.documentFile = finalPath; // assuming we want to save the path
        await request.save();

        res.json({
            message: 'Document uploaded and processed successfully',
            documentFile: finalPath,
            documentHash: documentHash,
            isBlockchainEligible
        });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Error processing document upload', error: error.message });
    }
});

module.exports = router;
