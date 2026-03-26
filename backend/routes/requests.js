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
        const request = await Request.findOneAndUpdate(
            { requestId: req.params.id },
            { status, name },
            { new: true }
        );

        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Log activity
        const log = new ActivityLog({
            userEmail: req.user.email,
            action: 'Update Request',
            details: `Updated request ${req.params.id} status to ${status || 'unchanged'}`
        });
        await log.save();

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

        // Generate SHA-256 hash based on request data
        const hash = crypto.createHash('sha256')
            .update(`${request.requestId}-${request.name}-${Date.now()}`)
            .digest('hex');

        request.documentHash = hash;
        await request.save();

        // Log activity
        const log = new ActivityLog({
            userEmail: req.user.email,
            action: 'Generate Hash',
            details: `Generated secure SHA-256 hash for request ${req.params.id}`
        });
        await log.save();

        res.json({ message: 'Hash generated successfully', hash });
    } catch (error) {
        res.status(500).json({ message: 'Error generating hash' });
    }
});

// Create a new request (Logged)
router.post('/', protect, async (req, res) => {
  try {
    const newDoc = new Request(req.body);
    await newDoc.save();

    // Log the activity
    const log = new ActivityLog({
      userEmail: req.user.email,
      action: 'Create Request',
      details: `Created new document request for: ${req.body.name || 'Unknown'}`
    });
    await log.save();

    res.json(newDoc);
  } catch (error) {
    res.status(500).json({ message: 'Error creating request' });
  }
});

module.exports = router;
