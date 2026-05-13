const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Request = require('../models/Request');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/authMiddleware');

// Get all requests
router.get('/', async (req, res) => {
  try {
    const requests = await Request.find().sort({ dateRequested: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requests' });
  }
});

// Update a request (Logged)
router.put('/:id', protect, async (req, res) => {
    try {
        const { status, name } = req.body;
        const updateData = {};
        if (status) updateData.status = status;
        if (name) updateData.name = name;

        const request = await Request.findOneAndUpdate(
            { requestId: req.params.id },
            updateData,
            { new: true }
        );

        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Log activity
        await ActivityLog.create({
            userEmail: req.user.email,
            userName: req.user.name || 'User',
            action: 'Update Request',
            type: '------',
            status: 'Successful',
            details: `Updated request ${req.params.id} status to ${status || 'unchanged'}`
        });

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
    const userName = req.user.name || 'User';

    const newDoc = await Request.create({
      requestId,
      name: userName,
      status: req.body.status || 'Pending',
      documentType: req.body.documentType,
      subDocumentType: req.body.subDocumentType || '',
      purpose: req.body.purpose || '',
      otherPurpose: req.body.otherPurpose || '',
      quantity: req.body.quantity || 1,
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

    res.json(newDoc);
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ message: 'Error creating request', error: error.message });
  }
});

module.exports = router;
