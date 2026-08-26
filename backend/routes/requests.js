const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Request = require('../models/Request');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/authMiddleware');

// Helper to enrich a request with student profile data if missing
const enrichRequestWithStudentData = async (reqObj) => {
  try {
    const Student = require('../models/Users/Student');
    const Alumni = require('../models/Users/Alumni');
    let student = null;
    
    // 1. Try to find by studentId if present
    if (reqObj.studentId) {
      student = await Student.findOne({ studentId: reqObj.studentId });
      if (!student) {
        student = await Alumni.findOne({ studentId: reqObj.studentId });
      }
    }
    
    // 2. We no longer guess by name to maintain data integrity. 
    // If studentId isn't provided, we can't reliably link the profile.
    
    if (student) {
      reqObj.studentId = student.studentId || reqObj.studentId || '';
      reqObj.course = student.course || reqObj.course || '';
      reqObj.yearLevel = student.yearLevel || reqObj.yearLevel || '';
      
      // Upgrade generic "User" names with their real registered name
      if (reqObj.name.toLowerCase() === 'user' && (student.firstName || student.lastName)) {
        reqObj.name = `${student.firstName || ''} ${student.lastName || ''}`.trim();
      }
    }
  } catch (err) {
    console.error('Error enriching request with student data:', err);
  }
  return reqObj;
};

// Get all requests (Filtered for students/alumni if authenticated, unfiltered for staff/admin)
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    
    // Apply smart role-based filtering since we now require authentication
    if (req.user && (req.user.role === 'student' || req.user.role === 'alumni')) {
      query = { requesterEmail: req.user.email };
    }

    const requests = await Request.find(query).sort({ dateRequested: 1 });
    
    // Dynamically enrich requests with student profile details (ID, Course, Year) for seamless UX
    const enrichedRequests = await Promise.all(
      requests.map(r => enrichRequestWithStudentData(r.toObject()))
    );
    
    res.json(enrichedRequests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requests' });
  }
});

// Get a single request by ID
router.get('/:id', protect, async (req, res) => {
    try {
        const request = await Request.findOne({ requestId: req.params.id });
        if (!request) return res.status(404).json({ message: 'Request not found' });
        
        const enrichedRequest = await enrichRequestWithStudentData(request.toObject());
        res.json(enrichedRequest);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching request' });
    }
});

// Update a request (Logged)
router.put('/:id', protect, async (req, res) => {
    try {
        const { status, name, documentHash, forceOverride, rejectionReason } = req.body;

        // Force override (payment bypass) requires super admin role
        if (forceOverride && req.user.role !== 'super admin') {
            return res.status(403).json({ message: 'Only super admins can perform force overrides.' });
        }

        const updateData = {};
        if (status) updateData.status = status;
        if (documentHash !== undefined) updateData.documentHash = documentHash;
        if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason;
        if (status === 'In Process') updateData.rejectionReason = ''; // Clear reason if reopened

        const request = await Request.findOneAndUpdate(
            { requestId: req.params.id },
            updateData,
            { new: true }
        );

        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Log activity — distinguish force overrides
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

        // Auto-notify student about request status update
        if (status) {
            try {
                const Notification = require('../models/Notification');
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
                    email: request.email || ''
                });
            } catch (err) {
                console.error('Failed to create request status update notification:', err);
            }
        }

        res.json(request);
    } catch (error) {
        res.status(500).json({ message: 'Error updating request' });
    }
});

// Generate Hash for request (Logged)
router.post('/:id/generate-hash', protect, async (req, res) => {
    try {
        const request = await Request.findOne({ requestId: req.params.id });
        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Generate SHA-256 hash
        const hash = crypto.createHash('sha256')
            .update(`${request.requestId}-${request.name}-${Date.now()}`)
            .digest('hex');

        request.documentHash = hash;
        await request.save();

        // Log activity
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
        res.status(500).json({ message: 'Error generating hash' });
    }
});

// Create a new request (Logged)
router.post('/', protect, async (req, res) => {
  try {
    const requestId = req.body.requestId || 'REQ-' + Date.now();
    
    // Support either body-passed fields or JWT payload
    let studentId = req.body.studentId || '';
    let course = req.body.course || '';
    let yearLevel = req.body.yearLevel || '';
    let userName = req.body.name || req.user.name || 'User';
    
    try {
      const Student = require('../models/Users/Student');
      const Alumni = require('../models/Users/Alumni');
      let student = await Student.findById(req.user.id);
      if (!student) student = await Alumni.findById(req.user.id);
      
      // Fallback 1: Resolve by email
      if (!student && req.user.email) {
        student = await Student.findOne({ email: req.user.email });
        if (!student) student = await Alumni.findOne({ email: req.user.email });
      }
      
      // We removed Fallback 2: Name matching to enforce data integrity

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

    // Log the activity
    await ActivityLog.create({
      userEmail: req.user.email,
      userName,
      action: 'Create Request',
      type: req.body.documentType || '------',
      status: 'Successful',
      details: `Created new document request for: ${userName}`
    });

    // Auto-notify registrars about the new request
    const Notification = require('../models/Notification');
    await Notification.create({
      message: `New document request (${req.body.documentType}) from ${userName}`,
      isRead: false
    });

    res.json(newDoc);
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ message: 'Error creating request', error: error.message });
  }
});

module.exports = router;
