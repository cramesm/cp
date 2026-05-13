const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const { protect, systemAdminOnly } = require('../middleware/authMiddleware');

// Get all activity logs (export as CSV) - System Admin Only
router.get('/export', protect, systemAdminOnly, async (req, res) => {
    try {
      const { data: logs, error } = await supabase
        .from('activity_logs').select('*').order('timestamp', { ascending: false });
      if (error) throw error;

      let csv = 'User,Action,Details,Timestamp\n';
      (logs || []).forEach(log => {
        csv += `"${log.user_email}","${log.action}","${log.details}","${log.timestamp}"\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=activity_logs.csv');
      res.status(200).send(csv);
    } catch (error) {
      res.status(500).json({ message: 'Error exporting logs' });
    }
  });

// Get all activity logs - System Admin Only
router.get('/', protect, systemAdminOnly, async (req, res) => {
  try {
    const { data: logs, error } = await supabase
      .from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(100);
    if (error) throw error;
    
    // Map to camelCase for frontend compatibility
    const mappedLogs = (logs || []).map(log => ({
        ...log,
        _id: log.id,
        userEmail: log.user_email,
        userName: log.user_name,
        timestamp: log.timestamp || log.created_at
    }));

    res.json(mappedLogs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activity logs' });
  }
});

// Create a log entry
router.post('/', protect, async (req, res) => {
    try {
        const { action, details, type, status } = req.body;
        const { data: newLog, error } = await supabase.from('activity_logs').insert({
            user_email: req.user.email,
            user_name: req.user.name || 'User',
            action,
            type: type || '------',
            status: status || 'Successful',
            details
        }).select().single();
        if (error) throw error;
        res.status(201).json(newLog);
    } catch (error) {
        res.status(500).json({ message: 'Error creating log' });
    }
});

module.exports = router;
