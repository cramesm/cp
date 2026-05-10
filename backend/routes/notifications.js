const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// Get all notifications
router.get('/', async (req, res) => {
  try {
    const { data: notifications, error } = await supabase
      .from('notifications').select('*').order('date', { ascending: false });
    if (error) throw error;
    res.json(notifications || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Mark as read
router.put('/:id/read', async (req, res) => {
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification' });
  }
});

module.exports = router;
