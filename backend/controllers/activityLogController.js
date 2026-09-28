const ActivityLog = require('../models/ActivityLog');
const Registrar = require('../models/Registrar');

/**
 * Helper to build departmental scoped query for logs
 */
const getScopedLogQuery = async (req) => {
  const userRole = (req.user?.role || '').toLowerCase();
  const userDept = (req.user?.department || '').toLowerCase();

  let query = {};

  // 1. Super Admin or IT Administrator: Global Master / System Logs (Unrestricted)
  if (
    userRole === 'super admin' || 
    userRole.includes('it administrator') || 
    userRole.includes('it admin') || 
    userDept.includes('it')
  ) {
    query = {};
  } else if (userRole.includes('registrar') || userDept === 'registrar') {
    // 2. Registrar Admin: Issuance Logs (document requests, hashing, releases, or actions by Registrar staff)
    const staffList = await Registrar.find({ department: 'Registrar' }).select('email name');
    const emails = staffList.map(s => s.email).filter(Boolean);
    const names = staffList.map(s => s.name).filter(Boolean);

    query = {
      $or: [
        { userEmail: { $in: emails } },
        { userName: { $in: names } },
        { action: { $regex: /(request|document|hash|release|tor|diploma|cert|registrar|blockchain)/i } },
        { details: { $regex: /(request|document|hash|release|tor|diploma|cert|registrar|blockchain)/i } },
        { type: { $nin: ['------', 'Payment', 'Refund'] } }
      ]
    };
  } else if (userRole.includes('accounting') || userDept === 'accounting') {
    // 3. Accounting Admin: Finance Logs (payments, receipts, refunds, cashier actions, or actions by Accounting staff)
    const staffList = await Registrar.find({ department: 'Accounting' }).select('email name');
    const emails = staffList.map(s => s.email).filter(Boolean);
    const names = staffList.map(s => s.name).filter(Boolean);

    query = {
      $or: [
        { userEmail: { $in: emails } },
        { userName: { $in: names } },
        { action: { $regex: /(payment|receipt|refund|transaction|cash|accounting|financial)/i } },
        { details: { $regex: /(payment|receipt|refund|transaction|cash|accounting|financial)/i } },
        { type: { $in: ['Payment', 'Refund', 'Cash'] } }
      ]
    };
  }

  // If a specific staffEmail filter was provided
  if (req.query.staffEmail) {
    query.userEmail = req.query.staffEmail;
  }

  return query;
};

const ActivityLogController = {
  // @desc    Export activity logs as CSV (Scoped by department for Department Admins, full for Super Admin/IT)
  exportLogs: async (req, res) => {
    try {
      const query = await getScopedLogQuery(req);
      const logs = await ActivityLog.find(query).sort({ timestamp: -1 });

      let csv = 'User,Action,Type,Status,Details,Timestamp\n';
      logs.forEach(log => {
        csv += `"${log.userEmail}","${log.action}","${log.type || ''}","${log.status || ''}","${(log.details || '').replace(/"/g, '""')}","${log.timestamp}"\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=activity_logs.csv');
      res.status(200).send(csv);
    } catch (error) {
      console.error('Error exporting logs:', error);
      res.status(500).json({ message: 'Error exporting logs' });
    }
  },

  // @desc    Get activity logs (Scoped by department for Department Admins, full for Super Admin/IT)
  getLogs: async (req, res) => {
    try {
      const query = await getScopedLogQuery(req);
      const logs = await ActivityLog.find(query).sort({ timestamp: -1 }).limit(200);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      res.status(500).json({ message: 'Error fetching activity logs' });
    }
  },

  // @desc    Create manual log entry
  createLog: async (req, res) => {
    try {
      const { action, details, type, status } = req.body;
      const newLog = await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'User',
        action,
        type: type || '------',
        status: status || 'Successful',
        details
      });
      res.status(201).json(newLog);
    } catch (error) {
      console.error('Error creating log:', error);
      res.status(500).json({ message: 'Error creating log' });
    }
  }
};

module.exports = ActivityLogController;
