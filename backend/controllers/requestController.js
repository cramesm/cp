const crypto = require('crypto');
const mongoose = require('mongoose');
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
        query = {
          $or: [
            { email: req.user.email },
            ...(req.user.id || req.user._id ? [{ userId: req.user.id || req.user._id }] : [])
          ]
        };
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
      const query = {
        $or: [
          { requestId: req.params.id },
          ...(mongoose.Types.ObjectId.isValid(req.params.id) ? [{ _id: req.params.id }] : [])
        ]
      };
      const request = await Request.findOne(query).lean();
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
        userId: req.user.id || req.user._id || null,
        name: userName,
        studentId,
        course,
        yearLevel,
        status: req.body.status || 'Pending',
        mobileStatus: (req.body.status || 'Pending').toLowerCase().replace(/\s+/g, '_'),
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
      if (status) {
        updateData.status = status;
        const normalizedMobileStatus = status === 'In Process' ? 'in_process' :
                                       status === 'Released' ? 'released' :
                                       status === 'Rejected' ? 'rejected' :
                                       status.toLowerCase().replace(/\s+/g, '_');
        updateData.mobileStatus = normalizedMobileStatus;
      }
      if (documentHash !== undefined) updateData.documentHash = documentHash;
      if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason;
      if (status === 'In Process') updateData.rejectionReason = '';

      const query = {
        $or: [
          { requestId: req.params.id },
          ...(mongoose.Types.ObjectId.isValid(req.params.id) ? [{ _id: req.params.id }] : [])
        ]
      };

      const request = await Request.findOneAndUpdate(
        query,
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
          let targetEmail = request.email || '';
          let targetUserId = request.userId || undefined;

          if (!targetEmail && request.studentId) {
            const studentUser = await Student.findOne({ studentId: request.studentId }).lean() ||
                                await Alumni.findOne({ studentId: request.studentId }).lean();
            if (studentUser) {
              targetEmail = studentUser.email || '';
              targetUserId = targetUserId || studentUser._id;
            }
          }

          if (targetEmail && !targetUserId) {
            const studentUser = await Student.findOne({ email: targetEmail }).lean() ||
                                await Alumni.findOne({ email: targetEmail }).lean();
            if (studentUser) {
              targetUserId = studentUser._id;
            }
          }

          let title = 'Request Status Update';
          let message = `Your request #${request.requestId} for ${request.documentType} is now ${status}!`;

          if (status === 'In Process') {
            title = 'Document Request Approved';
            message = `Your document request #${request.requestId} for ${request.documentType} has been approved and is now being processed!`;
          } else if (status === 'Released') {
            title = 'Document Ready for Pickup';
            message = `Your document request #${request.requestId} for ${request.documentType} is ready for pickup/delivery!`;
          } else if (status === 'Rejected') {
            title = 'Document Request Rejected';
            const readableReason = request.rejectionReason === 'incomplete' ? 'Incomplete Requirements' :
                                   request.rejectionReason === 'invalid' ? 'Invalid Information' :
                                   request.rejectionReason === 'unpaid' ? 'Payment Issue' :
                                   (request.rejectionReason || 'Requirements not met');
            message = `Your document request #${request.requestId} for ${request.documentType} was rejected. Reason: ${readableReason}`;
          }
          
          await Notification.create({
            title,
            message,
            isRead: false,
            email: targetEmail,
            userId: targetUserId,
            targetRole: 'student',
            type: 'request',
            link: `/requests/${request.requestId}`
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
      const request = await Request.findOne({
        $or: [
          { requestId: requestId },
          ...(mongoose.Types.ObjectId.isValid(requestId) ? [{ _id: requestId }] : [])
        ]
      });

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
          width: 200
        });

        const existingPdfBytes = req.file.buffer;
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        const qrImage = await pdfDoc.embedPng(qrCodeBuffer);

        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        // Compact QR code positioned at top right corner
        const qrSize = 75;
        const padding = 25;
        firstPage.drawImage(qrImage, {
          x: width - qrSize - padding,
          y: height - qrSize - padding,
          width: qrSize,
          height: qrSize,
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
    return res.status(403).json({ success: false, message: 'Document request deletion has been disabled.' });
  },

  // @desc    Delete single request
  deleteRequest: async (req, res) => {
    return res.status(403).json({ success: false, message: 'Document request deletion has been disabled.' });
  }
};

module.exports = RequestController;
