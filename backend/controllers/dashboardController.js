const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwtConfig');
const Request = require('../models/Request');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const Refund = require('../models/Refund');
const BlockchainTransaction = require('../models/BlockchainTransaction');
const Student = require('../models/Users/Student');
const Alumni = require('../models/Users/Alumni');
const Registrar = require('../models/Registrar');
const ActivityLog = require('../models/ActivityLog');
const { resolveUserRoleAndDept, getRoleNotificationFilter } = require('../utils/notificationFilter');

const DashboardController = {
  // @desc    Get dashboard summary statistics tailored for each role
  getStats: async (req, res) => {
    try {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

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
        Request.countDocuments({ status: { $regex: /^(released|completed)$/i } }),
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

      // Timezone-aware date boundaries for "Today"
      // Client offset is in minutes: getTimezoneOffset() = UTC - LocalTime (e.g. -480 for UTC+8)
      let clientOffset = -480;
      if (req.query.timezoneOffset !== undefined && !isNaN(parseInt(req.query.timezoneOffset, 10))) {
        clientOffset = parseInt(req.query.timezoneOffset, 10);
      } else if (req.headers['x-timezone-offset'] !== undefined && !isNaN(parseInt(req.headers['x-timezone-offset'], 10))) {
        clientOffset = parseInt(req.headers['x-timezone-offset'], 10);
      } else {
        const serverOffset = new Date().getTimezoneOffset();
        if (serverOffset !== 0) clientOffset = serverOffset;
      }

      const now = new Date();
      const clientLocalNow = new Date(now.getTime() - (clientOffset * 60 * 1000));
      const year = clientLocalNow.getUTCFullYear();
      const month = clientLocalNow.getUTCMonth();
      const date = clientLocalNow.getUTCDate();

      const startOfToday = new Date(Date.UTC(year, month, date, 0, 0, 0, 0) + (clientOffset * 60 * 1000));
      const endOfToday = new Date(Date.UTC(year, month, date, 23, 59, 59, 999) + (clientOffset * 60 * 1000));

      // Today's completed transactions & revenue
      const todayCompletedTxs = await Transaction.find({
        status: { $regex: /^completed$/i },
        updatedAt: { $gte: startOfToday, $lte: endOfToday }
      }).select('amount');

      const todayRevenue = todayCompletedTxs.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
      const todayCompletedPaymentsCount = todayCompletedTxs.length;

      // Today's released requests
      const todayReleasedRequestsCount = await Request.countDocuments({
        status: { $regex: /^(released|completed)$/i },
        $or: [
          { dateReleased: { $gte: startOfToday, $lte: endOfToday } },
          {
            $and: [
              { $or: [{ dateReleased: null }, { dateReleased: { $exists: false } }] },
              { updatedAt: { $gte: startOfToday, $lte: endOfToday } }
            ]
          }
        ]
      });

      // Separate staff counts by department
      const [
        registrarStaffCount,
        accountingStaffCount,
        itStaffCount,
        itActiveStaffCount,
        itInactiveStaffCount
      ] = await Promise.all([
        Registrar.countDocuments({
          $or: [
            { department: 'Registrar' },
            { role: { $regex: /registrar/i } }
          ]
        }),
        Registrar.countDocuments({
          $or: [
            { department: 'Accounting' },
            { role: { $regex: /accounting/i } }
          ]
        }),
        Registrar.countDocuments({
          $or: [
            { department: 'IT Administration' },
            { role: { $regex: /it/i } }
          ]
        }),
        Registrar.countDocuments({
          $or: [
            { department: 'IT Administration' },
            { role: { $regex: /it/i } }
          ],
          status: 'Active'
        }),
        Registrar.countDocuments({
          $or: [
            { department: 'IT Administration' },
            { role: { $regex: /it/i } }
          ],
          status: { $ne: 'Active' }
        })
      ]);

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
        itStaffCount,
        itActiveStaffCount,
        itInactiveStaffCount
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Error fetching stats' });
    }
  },

  // @desc    Get recent activities tailored for role-specific dashboard views
  getRecentActivity: async (req, res) => {
    try {
      let callerUser = req.user;
      if (!callerUser && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          callerUser = jwt.verify(token, JWT_SECRET);
        } catch (_tokenErr) {}
      }

      const { role, department } = await resolveUserRoleAndDept(callerUser);
      const notifFilter = getRoleNotificationFilter(role, department);

      const normRole = (role || '').toLowerCase();
      const normDept = (department || '').toLowerCase();
      const isAccountingOrSuper =
        normRole.includes('super admin') ||
        normRole.includes('accounting') ||
        normDept === 'accounting';

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
        Notification.find(notifFilter).sort({ date: -1, createdAt: -1 }).limit(6),
        Request.find().sort({ dateRequested: -1, createdAt: -1 }).limit(8),
        Request.find({ status: 'Pending' }).sort({ dateRequested: 1, createdAt: 1 }).limit(5),
        Transaction.find().sort({ createdAt: -1 }).limit(8),
        Transaction.find({ status: 'Pending Verification' }).sort({ createdAt: 1 }).limit(5),
        isAccountingOrSuper ? Refund.find().sort({ createdAt: -1 }).limit(6) : Promise.resolve([]),
        ActivityLog.find().sort({ createdAt: -1 }).limit(8)
      ]);

      // Batch query linked payment transactions for requests
      const allReqIds = [
        ...new Set(
          [...pendingRequests, ...priorityPendingRequests]
            .map(r => r.requestId)
            .filter(Boolean)
        )
      ];
      const linkedTransactions = allReqIds.length > 0
        ? await Transaction.find({ requestId: { $in: allReqIds } }).lean()
        : [];
      const txMap = {};
      linkedTransactions.forEach(t => {
        if (t.requestId) txMap[t.requestId] = t;
      });

      const enrich = (list) =>
        list.map(r => {
          const obj = r.toObject ? r.toObject() : { ...r };
          const tx = txMap[obj.requestId];
          obj.paymentStatus = tx ? tx.status : (obj.paymentReceiptId ? 'Pending Verification' : 'No Transaction');
          obj.isPaymentVerified = tx?.status === 'Completed';
          obj.paymentTx = tx || null;
          return obj;
        });

      res.json({
        transactions,
        notifications,
        pendingRequests: enrich(pendingRequests),
        priorityPendingRequests: enrich(priorityPendingRequests),
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
