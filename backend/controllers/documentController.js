const path = require('path');
const crypto = require('crypto');
const Document = require('../models/Document');
const ActivityLog = require('../models/ActivityLog');
const Request = require('../models/Request');
const Transaction = require('../models/Transaction');
const blockchainService = require('../services/blockchainService');

const DocumentController = {
  // @desc    Get all documents (with optional category filter)
  getAllDocuments: async (req, res) => {
    try {
      const filter = {};
      if (req.query.category && req.query.category !== 'All') {
        filter.category = req.query.category;
      }
      const documents = await Document.find(filter).sort({ createdAt: 1 });
      res.json(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ message: 'Error fetching documents' });
    }
  },

  // @desc    Get single document by documentId
  getDocumentById: async (req, res) => {
    try {
      const doc = await Document.findOne({ documentId: req.params.id });
      if (!doc) return res.status(404).json({ message: 'Document not found' });
      res.json(doc);
    } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({ message: 'Error fetching document' });
    }
  },

  // @desc    Create new document record
  createDocument: async (req, res) => {
    try {
      const { category, documentType, studentName, studentId, course, yearLevel, purpose, linkedRequestId, notes } = req.body;

      if (!category || !documentType || !studentName || !studentId) {
        return res.status(400).json({ message: 'Category, document type, student name, and student ID are required' });
      }

      const documentId = 'DOC-' + Date.now();
      const pdfPath = req.file ? `data:application/pdf;base64,${req.file.buffer.toString('base64')}` : '';

      const newDoc = await Document.create({
        documentId,
        category,
        documentType,
        studentName,
        studentId,
        course: course || '',
        yearLevel: yearLevel || '',
        purpose: purpose || '',
        linkedRequestId: linkedRequestId || '',
        status: 'Draft',
        pdfPath,
        notes: notes || '',
        generatedBy: req.user.name || req.user.email || ''
      });

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'User',
        action: 'Create Document',
        type: documentType,
        status: 'Successful',
        details: `Created ${documentType} for ${studentName} (${studentId})`
      });

      res.status(201).json(newDoc);
    } catch (error) {
      console.error('Error creating document:', error);
      res.status(500).json({ message: 'Error creating document', error: error.message });
    }
  },

  // @desc    Update document
  updateDocument: async (req, res) => {
    try {
      const doc = await Document.findOne({ documentId: req.params.id });
      if (!doc) return res.status(404).json({ message: 'Document not found' });

      const { status, notes, studentName, studentId, course, yearLevel, purpose } = req.body;

      if (status) doc.status = status;
      if (notes !== undefined) doc.notes = notes;
      if (studentName) doc.studentName = studentName;
      if (studentId) doc.studentId = studentId;
      if (course !== undefined) doc.course = course;
      if (yearLevel !== undefined) doc.yearLevel = yearLevel;
      if (purpose !== undefined) doc.purpose = purpose;
      if (req.file) doc.pdfPath = `data:application/pdf;base64,${req.file.buffer.toString('base64')}`;

      await doc.save();

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'User',
        action: 'Update Document',
        type: doc.documentType,
        status: 'Successful',
        details: `Updated ${doc.documentType} (${doc.documentId}) - Status: ${doc.status}`
      });

      res.json(doc);
    } catch (error) {
      console.error('Error updating document:', error);
      res.status(500).json({ message: 'Error updating document' });
    }
  },

  // @desc    Finalize document (without blockchain)
  finalizeDocument: async (req, res) => {
    try {
      const doc = await Document.findOne({ documentId: req.params.id });
      if (!doc) return res.status(404).json({ message: 'Document not found' });

      if (doc.status !== 'Draft') {
        return res.status(400).json({ message: 'Only documents in Draft status can be finalized' });
      }

      doc.status = 'Finalized';
      await doc.save();

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'User',
        action: 'Finalize Document',
        type: doc.documentType,
        status: 'Successful',
        details: `Finalized ${doc.documentType} for ${doc.studentName} (${doc.documentId})`
      });

      res.json(doc);
    } catch (error) {
      console.error('Error finalizing document:', error);
      res.status(500).json({ message: 'Error finalizing document' });
    }
  },

  // @desc    Generate SHA-256 hash & optionally anchor to blockchain
  generateHash: async (req, res) => {
    try {
      const doc = await Document.findOne({ documentId: req.params.id });
      if (!doc) return res.status(404).json({ message: 'Document not found' });

      const hash = crypto.createHash('sha256')
        .update(`${doc.documentId}-${doc.studentName}-${doc.documentType}-${Date.now()}`)
        .digest('hex');

      const isBlockchainEligible = 
        doc.category === 'Transcript of Records' || 
        doc.documentType.toLowerCase().includes('diploma') || 
        doc.documentType.toLowerCase().includes('transcript');

      let anchorResult = { 
        isSimulated: false, 
        status: 'Secured on Local Database Index Only',
        txID: 'TXN-' + Date.now(),
        blockNumber: 'N/A',
        nonce: 'N/A',
        miner: 'Local Registry Node',
        contractAddress: 'N/A',
        gasUsed: 'N/A'
      };

      if (isBlockchainEligible) {
        anchorResult = await blockchainService.anchorDocumentHash(
          doc.documentId,
          doc.studentId,
          doc.studentName,
          hash
        );
      }

      if (doc.linkedRequestId) {
        await Request.findOneAndUpdate(
          { requestId: doc.linkedRequestId },
          { documentHash: hash, status: 'Released' }
        );
      } else {
        await Request.create({
          requestId: doc.documentId,
          name: doc.studentName,
          status: 'Released',
          documentType: doc.documentType,
          documentHash: hash
        });
      }

      await Transaction.create({
        transactionId: anchorResult.txID || 'TXN-' + Date.now(),
        requestId: doc.linkedRequestId || doc.documentId,
        name: doc.studentName,
        documentType: doc.documentType,
        paymentMode: 'Other Online Payment',
        amount: '0.00',
        status: 'Completed',
        verifiedBy: req.user.email || req.user.name || 'System Admin',
        verifiedAt: new Date()
      });

      doc.documentHash = hash;
      doc.status = 'Finalized';
      await doc.save();

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'User',
        action: 'Hash Generation',
        type: doc.documentType,
        status: 'Successful',
        details: isBlockchainEligible
          ? `Generated SHA-256 hash & anchored to Blockchain for ${doc.documentType} (${doc.documentId})`
          : `Generated SHA-256 hash & indexed locally for ${doc.documentType} (${doc.documentId})`
      });

      res.json({ 
        message: isBlockchainEligible 
          ? 'Hash generated and anchored to blockchain successfully' 
          : 'Hash generated and secured locally successfully', 
        hash, 
        document: doc,
        blockchainReceipt: anchorResult
      });
    } catch (error) {
      console.error('Error generating hash:', error);
      res.status(500).json({ message: 'Error generating hash and anchoring to blockchain' });
    }
  },

  // @desc    Delete a document
  deleteDocument: async (req, res) => {
    try {
      const doc = await Document.findOne({ documentId: req.params.id });
      if (!doc) return res.status(404).json({ message: 'Document not found' });

      await Document.deleteOne({ documentId: req.params.id });

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'User',
        action: 'Delete Document',
        type: doc.documentType,
        status: 'Successful',
        details: `Deleted ${doc.documentType} for ${doc.studentName} (${doc.documentId})`
      });

      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ message: 'Error deleting document' });
    }
  },

  // @desc    Download document PDF
  downloadDocument: async (req, res) => {
    try {
      const doc = await Document.findOne({ documentId: req.params.id });
      if (!doc || !doc.pdfPath) {
        return res.status(404).json({ message: 'PDF not found for this document' });
      }

      if (doc.pdfPath.startsWith('data:application/pdf;base64,')) {
        const base64Data = doc.pdfPath.replace('data:application/pdf;base64,', '');
        const pdfBuffer = Buffer.from(base64Data, 'base64');
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${doc.documentType}-${doc.studentName}.pdf"`);
        res.send(pdfBuffer);
      } else {
        const filePath = path.join(__dirname, '../uploads/documents', doc.pdfPath);
        res.download(filePath, `${doc.documentType}-${doc.studentName}.pdf`);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      res.status(500).json({ message: 'Error downloading document' });
    }
  }
};

module.exports = DocumentController;
