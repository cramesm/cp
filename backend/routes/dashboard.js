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

    // Mock initial stats if db is empty for previewing
    if (totalRequests === 0) {
      return res.json({
         totalRequests: 50,
         pendingRequests: 50,
         inProcessRequests: 50,
         approvedRequests: 250,
         releasedRequests: 10,
         blockchainTransactions: 250
      });
    }

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
     const recentTransactions = await Transaction.find().sort({ date: -1 }).limit(5);
     const recentNotifications = await Notification.find().sort({ date: -1 }).limit(5);
     const pendingRequestsList = await Request.find({ status: 'Pending' }).sort({ dateRequested: -1 }).limit(5);

     // Mock data if empty
     res.json({
         transactions: recentTransactions.length ? recentTransactions : [
             { requestId: 'REQ1234-2026', transactionHash: '0x1234...967' },
             { requestId: 'REQ1235-2026', transactionHash: '0x5678...321' }
         ],
         notifications: recentNotifications.length ? recentNotifications : [
             { message: '3 new transcript requests pending approval', isRead: false },
             { message: 'Failed blockchain submission', isRead: false },
             { message: 'REQ1234-2026 waiting for 2 days', isRead: false }
         ],
         pendingRequests: pendingRequestsList.length ? pendingRequestsList : [
             { requestId: 'REQ1234-2026', name: 'Alyssa Jane Cruz', status: 'Pending', dateRequested: 'January 30, 2026' },
             { requestId: 'REQ1235-2026', name: 'Alyssa Jane Cruz', status: 'Pending', dateRequested: 'January 30, 2026' }
         ]
     });
   } catch (error) {
     res.status(500).json({ message: 'Error fetching recent activity' });
   }
});

module.exports = router;
