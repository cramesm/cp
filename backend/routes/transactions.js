const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/authMiddleware');

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

// Create a new transaction (Logged)
router.post('/', protect, async (req, res) => {
    try {
        const newTx = new Transaction(req.body);
        await newTx.save();

        // Log activity
        const log = new ActivityLog({
            userEmail: req.user.email,
            userName: req.user.name || 'User',
            action: 'Blockchain Transaction',
            type: req.body.documentType || '------',
            status: 'Successful',
            details: `Submitted transaction to blockchain for Request: ${req.body.requestId || 'Unknown'}`
        });
        await log.save();

        res.json(newTx);
    } catch (error) {
        res.status(500).json({ message: 'Error recording transaction' });
    }
});

module.exports = router;
