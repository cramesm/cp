const crypto = require('crypto');
const QRCode = require('qrcode');
const { PDFDocument } = require('pdf-lib');
const Request = require('../models/Request');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const Student = require('../models/Users/Student');
const Alumni = require('../models/Users/Alumni');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Batch helper to enrich requests with student/alumni profile data in 2 queries instead of 2*N queries
const batchEnrichRequests = async (requestsList) => {
  try {
    const studentIds = [...new Set(requestsList.map(r => r.studentId).filter(Boolean))];
    
    if (studentIds.length === 0) return requestsList;

    const [students, alumni] = await Promise.all([
      Student.find({ studentId: { $in: studentIds } }).lean(),
      Alumni.find({ studentId: { $in: studentIds } }).lean()
    ]);

    const studentMap = {};
    students.forEach(s => { studentMap[s.studentId] = s; });
    alumni.forEach(a => { studentMap[a.studentId] = a; });

    return requestsList.map(reqObj => {
      const student = reqObj.studentId ? studentMap[reqObj.studentId] : null;
      if (student) {
        reqObj.studentId = student.studentId || reqObj.studentId || '';
        reqObj.course = student.course || reqObj.course || '';
        reqObj.yearLevel = student.yearLevel || reqObj.yearLevel || '';
        
        if (reqObj.name && reqObj.name.toLowerCase() === 'user' && (student.firstName || student.lastName)) {
          reqObj.name = `${student.firstName || ''} ${student.lastName || ''}`.trim();
        }
      }
      return reqObj;
    });
  } catch (err) {
    console.error('Error batch enriching requests:', err);
    return requestsList;
  }
};

// Single item enrichment helper
const enrichRequestWithStudentData = async (reqObj) => {
  try {
    const result = await batchEnrichRequests([reqObj]);
    return result[0] || reqObj;
  } catch (err) {
    console.error('Error in enrichRequestWithStudentData:', err);
    return reqObj;
  }
};

const RequestController = {
  // @desc    Get all requests (filtered for student/alumni, unfiltered for staff/admin)
  getAllRequests: async (req, res) => {
    try {
      let query = {};
      
      if (req.user && (req.user.role === 'student' || req.user.role === 'alumni')) {
        query = { email: req.user.email };
      }

      const requests = await Request.find(query).sort({ dateRequested: 1 }).lean();
      const enrichedRequests = await batchEnrichRequests(requests);
      
      res.json(enrichedRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      res.status(500).json({ message: 'Error fetching requests', error: error.message });
    }
  },

  // @desc    Get single request by ID
  getRequestById: async (req, res) => {
    try {
      const request = await Request.findOne({ requestId: req.params.id }).lean();
      if (!request) return res.status(404).json({ message: 'Request not found' });
      
      const enrichedRequest = await enrichRequestWithStudentData(request);
      res.json(enrichedRequest);
    } catch (error) {
      console.error('Error fetching single request:', error);
      res.status(500).json({ message: 'Error fetching request details' });
    }
  },

  // @desc    Create new document request
  createRequest: async (req, res) => {
    try {
      const requestId = req.body.requestId || 'REQ-' + Date.now();
      
      let studentId = req.body.studentId || '';
      let course = req.body.course || '';
      let yearLevel = req.body.yearLevel || '';
      let userName = req.body.name || req.user.name || 'User';
      
      try {
        let student = await Student.findById(req.user.id);
        if (!student) student = await Alumni.findById(req.user.id);
        
        if (!student && req.user.email) {
          student = await Student.findOne({ email: req.user.email });
          if (!student) student = await Alumni.findOne({ email: req.user.email });
        }

        if (student) {
          if (!userName || userName === 'User') {
            userName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
          }
          if (!studentId) studentId = student.studentId || '';
          if (!course) course = student.course || '';
          if (!yearLevel) yearLevel = student.yearLevel || '';
        }
      } catch (err) {
        console.error('Failed to auto-resolve student profile details for request:', err);
      }

      // Duplicate Request Check
      const documentType = req.body.documentType;
      const userEmail = req.user?.email || req.body.email;
      const userStudentId = studentId || req.body.studentId;

      if (documentType && (userEmail || userStudentId)) {
        const matchCriteria = [];
        if (userEmail) matchCriteria.push({ email: userEmail });
        if (userStudentId) matchCriteria.push({ studentId: userStudentId });

        const existingActive = await Request.findOne({
          $or: matchCriteria,
          documentType: documentType,
          status: { $in: ['Pending', 'In Process'] }
        });
        if (existingActive) {
          return res.status(409).json({
            message: `You already have an active request for "${documentType}" (Request ID: ${existingActive.requestId}). Please wait until your existing request is Released or Rejected before submitting a new one.`,
            existingRequestId: existingActive.requestId,
            existingStatus: existingActive.status
          });
        }
      }

      const newDoc = await Request.create({
        requestId,
        name: userName,
        studentId,
        course,
        yearLevel,
        status: req.body.status || 'Pending',
        documentType: req.body.documentType,
        subDocumentType: req.body.subDocumentType || '',
        purpose: req.body.purpose || '',
        otherPurpose: req.body.otherPurpose || '',
        quantity: req.body.quantity || 1,
        email: req.user.email || ''
      });

      await ActivityLog.create({
        userEmail: req.user.email,
        userName,
        action: 'Create Request',
        type: req.body.documentType || '------',
        status: 'Successful',
        details: `Created new document request for: ${userName}`
      });

      await Notification.create({
        message: `New document request received: ${req.body.documentType} from ${userName} (ID: ${studentId || 'N/A'}) — Request #${requestId}`,
        isRead: false,
        targetRole: 'admin',
        type: 'request',
        link: '/requests'
      });

      res.json(newDoc);
    } catch (error) {
      console.error('Error creating request:', error);
      res.status(500).json({ message: 'Error creating request', error: error.message });
    }
  },

  // @desc    Update request status/details
  updateRequest: async (req, res) => {
    try {
      const { status, name, documentHash, forceOverride, rejectionReason } = req.body;

      if (forceOverride && req.user.role !== 'super admin') {
        return res.status(403).json({ message: 'Only super admins can perform force overrides.' });
      }

      const updateData = {};
      if (status) updateData.status = status;
      if (documentHash !== undefined) updateData.documentHash = documentHash;
      if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason;
      if (status === 'In Process') updateData.rejectionReason = '';

      const request = await Request.findOneAndUpdate(
        { requestId: req.params.id },
        updateData,
        { new: true }
      );

      if (!request) return res.status(404).json({ message: 'Request not found' });

      const actionLabel = forceOverride ? 'Force Override' : 'Update Request';
      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'User',
        action: actionLabel,
        type: '------',
        status: 'Successful',
        details: forceOverride
          ? `[SUPER ADMIN] Bypassed verification for request ${req.params.id}, status set to ${status}`
          : `Updated request ${req.params.id} status to ${status || 'unchanged'}`
      });

      if (status) {
        try {
          let message = `Your request #${request.requestId} for ${request.documentType} is now ${status}!`;
          if (status === 'Released') {
            message = `Your request #${request.requestId} for ${request.documentType} is ready for pickup!`;
          } else if (status === 'Rejected' && request.rejectionReason) {
            const readableReason = request.rejectionReason === 'incomplete' ? 'Incomplete Requirements' :
                                   request.rejectionReason === 'invalid' ? 'Invalid Information' :
                                   request.rejectionReason === 'unpaid' ? 'Payment Issue' :
                                   request.rejectionReason;
            message = `Your request #${request.requestId} for ${request.documentType} was rejected. Reason: ${readableReason}`;
          }
          
          await Notification.create({
            message,
            isRead: false,
            email: request.email || '',
            targetRole: 'student',
            type: 'request'
          });
        } catch (err) {
          console.error('Failed to create request status update notification:', err);
        }
      }

      res.json(request);
    } catch (error) {
      console.error('Error updating request:', error);
      res.status(500).json({ message: 'Error updating request' });
    }
  },

  // @desc    Generate hash for request
  generateHash: async (req, res) => {
    try {
      const request = await Request.findOne({ requestId: req.params.id });
      if (!request) return res.status(404).json({ message: 'Request not found' });

      const hash = crypto.createHash('sha256')
        .update(`${request.requestId}-${request.name}-${Date.now()}`)
        .digest('hex');

      request.documentHash = hash;
      await request.save();

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'User',
        action: 'Hash Generation',
        type: request.documentType || '------',
        status: 'Successful',
        details: `Generated secure SHA-256 hash for request ${req.params.id}`
      });

      res.json({ message: 'Hash generated successfully', hash });
    } catch (error) {
      console.error('Error generating hash:', error);
      res.status(500).json({ message: 'Error generating hash' });
    }
  },

  // @desc    Upload document attachment with optional QR embedding
  uploadDocumentFile: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const requestId = req.params.id;
      const request = await Request.findOne({ requestId: requestId });

      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }

      const docType = (request.documentType || request.document_type || '').toLowerCase();
      const isBlockchainEligible = docType.includes('transcript') || docType.includes('tor') || docType.includes('diploma');

      let finalBase64String = `data:application/pdf;base64,${req.file.buffer.toString('base64')}`;
      let documentHash = request.documentHash;

      if (isBlockchainEligible) {
        if (!documentHash) {
          documentHash = crypto.createHash('sha256')
            .update(`${request.requestId}-${request.name}-${Date.now()}`)
            .digest('hex');
          request.documentHash = documentHash;
        }

        const validationUrl = `${FRONTEND_URL}/verify/results?hash=${documentHash}`;
        const qrCodeBuffer = await QRCode.toBuffer(validationUrl, {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: 150
        });

        const existingPdfBytes = req.file.buffer;
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        const qrImage = await pdfDoc.embedPng(qrCodeBuffer);
        const qrDims = qrImage.scale(1);

        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width } = firstPage.getSize();

        const padding = 30;
        firstPage.drawImage(qrImage, {
          x: width - qrDims.width - padding,
          y: padding,
          width: qrDims.width,
          height: qrDims.height,
        });

        const modifiedPdfBytes = await pdfDoc.save();
        finalBase64String = `data:application/pdf;base64,${Buffer.from(modifiedPdfBytes).toString('base64')}`;
      }

      request.documentFile = finalBase64String;
      await request.save();

      res.json({
        message: 'Document uploaded and processed successfully',
        documentFile: finalBase64String,
        documentHash: documentHash,
        isBlockchainEligible
      });
    } catch (error) {
      console.error('Upload Error:', error);
      res.status(500).json({ message: 'Error processing document upload', error: error.message });
    }
  },

  // @desc    Bulk delete requests
  bulkDeleteRequests: async (req, res) => {
    try {
      const { requestIds } = req.body;
      if (!Array.isArray(requestIds) || requestIds.length === 0) {
        return res.status(400).json({ success: false, message: 'Please provide an array of request IDs to delete.' });
      }

      const result = await Request.deleteMany({
        $or: [
          { requestId: { $in: requestIds } },
          { _id: { $in: requestIds.filter(id => id && id.match(/^[0-9a-fA-F]{24}$/)) } }
        ]
      });

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'Super Admin',
        action: 'Bulk Delete Requests',
        type: 'Request',
        status: 'Successful',
        details: `Bulk deleted ${result.deletedCount} document request(s).`
      });

      res.json({ success: true, message: `Successfully deleted ${result.deletedCount} request(s).`, deletedCount: result.deletedCount });
    } catch (error) {
      console.error('Error bulk deleting requests:', error);
      res.status(500).json({ success: false, message: 'Failed to bulk delete requests.', error: error.message });
    }
  },

  // @desc    Delete single request
  deleteRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const request = await Request.findOneAndDelete({
        $or: [
          { requestId: id },
          ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])
        ]
      });

      if (!request) {
        return res.status(404).json({ success: false, message: 'Request not found.' });
      }

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'Super Admin',
        action: 'Delete Request',
        type: request.documentType || 'Request',
        status: 'Successful',
        details: `Deleted request ${request.requestId} for ${request.name || 'User'}.`
      });

      res.json({ success: true, message: `Request ${request.requestId} deleted successfully.` });
    } catch (error) {
      console.error('Error deleting request:', error);
      res.status(500).json({ success: false, message: 'Failed to delete request.', error: error.message });
    }
  }
};

module.exports = RequestController;
