const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

router.get('/stats', async (req, res) => {
  try {
    const totalRequests = await Request.countDocuments();
    const pendingRequests = await Request.countDocuments({ status: 'Pending' });
    const inProcessRequests = await Request.countDocuments({ status: 'In Process' });
    const approvedRequests = await Request.countDocuments({ status: 'Approved' });
    const releasedRequests = await Request.countDocuments({ status: 'Released' });
    const blockchainTransactions = await Transaction.countDocuments();

    res.json({
      totalRequests,
      pendingRequests,
      inProcessRequests,
      approvedRequests,
      releasedRequests,
      blockchainTransactions
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

router.get('/recent', async (req, res) => {
   try {
     const transactions = await Transaction.find().sort({ date: -1 }).limit(5);
     const notifications = await Notification.find().sort({ date: -1 }).limit(5);
     const pendingRequests = await Request.find({ status: 'Pending' }).sort({ dateRequested: -1 }).limit(5);

     res.json({
         transactions,
         notifications,
         pendingRequests
     });
   } catch (error) {
     res.status(500).json({ message: 'Error fetching recent activity' });
   }
});

module.exports = router;
