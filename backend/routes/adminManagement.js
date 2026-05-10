const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const supabase = require('../supabaseClient');
const { protect, systemAdminOnly } = require('../middleware/authMiddleware');

// All routes here are protected and SystemAdmin only
router.use(protect);
router.use(systemAdminOnly);

// @route   GET /api/admins
router.get('/', async (req, res) => {
  try {
    const { data: admins, error } = await supabase
      .from('admins').select('id, email, role, name, profile_pic, created_at, updated_at');
    if (error) throw error;
    res.json(admins || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admins' });
  }
});

// @route   POST /api/admins
router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: existingAdmin } = await supabase
      .from('admins').select('id').eq('email', email).single();
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { data: newAdmin, error } = await supabase.from('admins').insert({
      email,
      password: hashedPassword,
      role: 'admin'
    }).select('id, email, role').single();

    if (error) throw error;

    // Log the action
    await supabase.from('activity_logs').insert({
      user_email: req.user.email,
      user_name: req.user.name || 'System Admin',
      action: 'Create Admin',
      type: '------',
      status: 'Successful',
      details: `Created new admin account: ${email}`
    });

    res.status(201).json({ message: 'Admin created successfully', admin: newAdmin });
  } catch (error) {
    res.status(500).json({ message: 'Error creating admin' });
  }
});

// @route   POST /api/admins/:id/reset-password
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { data: admin } = await supabase.from('admins').select('*').eq('id', req.params.id).single();
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    await supabase.from('activity_logs').insert({
      user_email: req.user.email,
      user_name: req.user.name || 'System Admin',
      action: 'Force Reset Password',
      type: '------',
      status: 'Successful',
      details: `Triggered password reset for admin: ${admin.email}`
    });

    res.json({ message: 'Password reset triggered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// @route   DELETE /api/admins/:id
router.delete('/:id', async (req, res) => {
  try {
    const { data: adminToDelete } = await supabase
      .from('admins').select('*').eq('id', req.params.id).single();
    if (!adminToDelete) return res.status(404).json({ message: 'Admin not found' });

    const email = adminToDelete.email;
    const { error } = await supabase.from('admins').delete().eq('id', req.params.id);
    if (error) throw error;

    await supabase.from('activity_logs').insert({
      user_email: req.user.email,
      user_name: req.user.name || 'System Admin',
      action: 'Delete Admin',
      type: '------',
      status: 'Successful',
      details: `Deleted admin account: ${email}`
    });

    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting admin' });
  }
});

module.exports = router;
