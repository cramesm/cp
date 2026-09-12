const Request = require('../models/Request');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const Refund = require('../models/Refund');
const BlockchainTransaction = require('../blockchain_essentials/modelBC/blockchainTransactionModel');

const DashboardController = {
  // @desc    Get dashboard summary statistics
  getStats: async (req, res) => {
    try {
      const [
        totalRequests,
        pendingRequests,
        inProcessRequests,
        rejectedRequests,
        releasedRequests,
        blockchainTransactions,
        pendingRefunds
      ] = await Promise.all([
        Request.countDocuments(),
        Request.countDocuments({ status: 'Pending' }),
        Request.countDocuments({ status: 'In Process' }),
        Request.countDocuments({ status: 'Rejected' }),
        Request.countDocuments({ status: 'Released' }),
        BlockchainTransaction.countDocuments(),
        Refund.countDocuments({ status: { $regex: /^pending$/i } })
      ]);

      res.json({
        totalRequests,
        pendingRequests,
        inProcessRequests,
        rejectedRequests,
        releasedRequests,
        blockchainTransactions,
        pendingRefunds
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Error fetching stats' });
    }
  },

  // @desc    Get recent activities for dashboard
  getRecentActivity: async (req, res) => {
    try {
      const adminFilter = {
        $or: [
          { targetRole: 'admin' },
          { targetRole: 'all' },
          {
            targetRole: { $exists: false },
            message: { $not: /^(your request|your refund|your account|your password|your profile)/i }
          }
        ]
      };

      const [transactions, notifications, pendingRequests] = await Promise.all([
        BlockchainTransaction.find().sort({ createdAt: -1 }).limit(5),
        Notification.find(adminFilter).sort({ date: -1, createdAt: -1 }).limit(5),
        Request.find({ status: 'Pending' }).sort({ dateRequested: -1 }).limit(5)
      ]);

      res.json({
        transactions,
        notifications,
        pendingRequests
      });
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      res.status(500).json({ message: 'Error fetching recent activity' });
    }
  }
};

module.exports = DashboardController;
