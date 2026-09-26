const Request = require('../models/Request');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const Refund = require('../models/Refund');
const BlockchainTransaction = require('../blockchain_essentials/modelBC/blockchainTransactionModel');
const Student = require('../models/Users/Student');
const Alumni = require('../models/Users/Alumni');
const Registrar = require('../models/Registrar');
const ActivityLog = require('../models/ActivityLog');

const DashboardController = {
  // @desc    Get dashboard summary statistics tailored for each role
  getStats: async (req, res) => {
    try {
      const [
        totalRequests,
        pendingRequests,
        inProcessRequests,
        rejectedRequests,
        releasedRequests,
        blockchainTransactions,
        pendingRefunds,
        totalRefunds,
        pendingPayments,
        completedPayments,
        rejectedPayments,
        totalStudents,
        totalAlumni,
        activeStaff,
        inactiveStaff,
        completedTxs,
        approvedRefundsList
      ] = await Promise.all([
        Request.countDocuments(),
        Request.countDocuments({ status: 'Pending' }),
        Request.countDocuments({ status: 'In Process' }),
        Request.countDocuments({ status: 'Rejected' }),
        Request.countDocuments({ status: 'Released' }),
        BlockchainTransaction.countDocuments(),
        Refund.countDocuments({ status: { $regex: /^pending$/i } }),
        Refund.countDocuments(),
        Transaction.countDocuments({ status: 'Pending Verification' }),
        Transaction.countDocuments({ status: 'Completed' }),
        Transaction.countDocuments({ status: 'Rejected' }),
        Student.countDocuments(),
        Alumni.countDocuments(),
        Registrar.countDocuments({ status: 'Active' }),
        Registrar.countDocuments({ status: { $ne: 'Active' } }),
        Transaction.find({ status: 'Completed' }).select('amount'),
        Refund.find({ status: { $regex: /^approved$/i } }).select('amount')
      ]);

      const totalRevenue = completedTxs.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
      const totalRefunded = approvedRefundsList.reduce((sum, rf) => sum + (parseFloat(rf.amount) || 0), 0);

      // Start of today
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      // Today's completed transactions & revenue
      const todayCompletedTxs = await Transaction.find({
        status: 'Completed',
        updatedAt: { $gte: startOfToday }
      }).select('amount');

      const todayRevenue = todayCompletedTxs.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
      const todayCompletedPaymentsCount = todayCompletedTxs.length;

      // Today's released requests
      const todayReleasedRequestsCount = await Request.countDocuments({
        status: 'Released',
        updatedAt: { $gte: startOfToday }
      });

      // Separate staff counts by department
      const registrarStaffCount = await Registrar.countDocuments({
        $or: [
          { department: 'Registrar' },
          { role: { $regex: /registrar/i } }
        ]
      });

      const accountingStaffCount = await Registrar.countDocuments({
        $or: [
          { department: 'Accounting' },
          { role: { $regex: /accounting/i } }
        ]
      });

      const itStaffCount = await Registrar.countDocuments({
        $or: [
          { department: 'IT Administration' },
          { role: { $regex: /it/i } }
        ]
      });

      // Payment channels distribution
      const [gcashCount, landbankCount, otherPaymentCount] = await Promise.all([
        Transaction.countDocuments({ paymentMode: { $regex: /gcash/i } }),
        Transaction.countDocuments({ paymentMode: { $regex: /landbank/i } }),
        Transaction.countDocuments({ paymentMode: { $not: /(gcash|landbank)/i } })
      ]);

      res.json({
        // Request & Academic Document Metrics (Registrar & Super Admin)
        totalRequests,
        pendingRequests,
        inProcessRequests,
        rejectedRequests,
        releasedRequests,
        blockchainTransactions,
        todayReleasedRequestsCount,

        // Financial & Payment Metrics (Accounting & Super Admin)
        totalRevenue,
        totalRefunded,
        pendingPayments,
        completedPayments,
        rejectedPayments,
        pendingRefunds,
        totalRefunds,
        todayRevenue,
        todayCompletedPaymentsCount,
        paymentChannels: {
          gcash: gcashCount,
          landbank: landbankCount,
          other: otherPaymentCount
        },

        // User & Staff Metrics (IT Admin & Super Admin)
        totalStudents,
        totalAlumni,
        totalUsers: totalStudents + totalAlumni,
        activeStaff,
        inactiveStaff,
        registrarStaffCount,
        accountingStaffCount,
        itStaffCount
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Error fetching stats' });
    }
  },

  // @desc    Get recent activities tailored for role-specific dashboard views
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

      const [
        transactions,
        notifications,
        pendingRequests,
        priorityPendingRequests,
        recentPayments,
        priorityPendingPayments,
        recentRefunds,
        recentLogs
      ] = await Promise.all([
        BlockchainTransaction.find().sort({ createdAt: -1 }).limit(6),
        Notification.find(adminFilter).sort({ date: -1, createdAt: -1 }).limit(6),
        Request.find().sort({ dateRequested: -1, createdAt: -1 }).limit(8),
        Request.find({ status: 'Pending' }).sort({ dateRequested: 1, createdAt: 1 }).limit(5),
        Transaction.find().sort({ createdAt: -1 }).limit(8),
        Transaction.find({ status: 'Pending Verification' }).sort({ createdAt: 1 }).limit(5),
        Refund.find().sort({ createdAt: -1 }).limit(6),
        ActivityLog.find().sort({ createdAt: -1 }).limit(8)
      ]);

      res.json({
        transactions,
        notifications,
        pendingRequests,
        priorityPendingRequests,
        recentPayments,
        priorityPendingPayments,
        recentRefunds,
        recentLogs
      });
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      res.status(500).json({ message: 'Error fetching recent activity' });
    }
  }
};

module.exports = DashboardController;
