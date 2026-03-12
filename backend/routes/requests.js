const express = require('express');
const router = express.Router();
const Request = require('../models/Request');

// Get all requests
router.get('/', async (req, res) => {
  try {
    const requests = await Request.find().sort({ dateRequested: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requests' });
  }
});

// Create a new request
router.post('/', async (req, res) => {
  try {
    const newDoc = new Request(req.body);
    await newDoc.save();
    res.json(newDoc);
  } catch (error) {
    res.status(500).json({ message: 'Error creating request' });
  }
});

module.exports = router;
