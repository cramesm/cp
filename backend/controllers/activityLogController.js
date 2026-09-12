const ActivityLog = require('../models/ActivityLog');

const ActivityLogController = {
  // @desc    Export all activity logs as CSV (Super Admin Only)
  exportLogs: async (req, res) => {
    try {
      const logs = await ActivityLog.find().sort({ timestamp: -1 });

      let csv = 'User,Action,Details,Timestamp\n';
      logs.forEach(log => {
        csv += `"${log.userEmail}","${log.action}","${log.details}","${log.timestamp}"\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=activity_logs.csv');
      res.status(200).send(csv);
    } catch (error) {
      console.error('Error exporting logs:', error);
      res.status(500).json({ message: 'Error exporting logs' });
    }
  },

  // @desc    Get recent activity logs (Super Admin Only)
  getLogs: async (req, res) => {
    try {
      const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(100);
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
