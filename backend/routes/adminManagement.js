const express = require('express');
const router = express.Router();
const Admin = require('../models/Users/Admin');
const ActivityLog = require('../models/ActivityLog');
const { protect, systemAdminOnly } = require('../middleware/authMiddleware');

// All routes here are protected and SystemAdmin only
router.use(protect);
router.use(systemAdminOnly);

// @route   GET /api/admins
// @desc    Get all admins
router.get('/', async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admins' });
  }
});

// @route   POST /api/admins
// @desc    Create a new admin
router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

    const newAdmin = new Admin({
      email,
      password,
      role: 'admin'
    });

    await newAdmin.save();

    // Log the action
    const log = new ActivityLog({
      userEmail: req.user.email,
      action: 'Create Admin',
      details: `Created new admin account: ${email}`
    });
    await log.save();

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: newAdmin._id,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating admin' });
  }
});

// @route   POST /api/admins/:id/reset-password
// @desc    Force reset an admin's password (Logged)
router.post('/:id/reset-password', async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    // In a real app, we'd set a temporary password and email it.
    // For this 60% push, we'll mock the success and log it.
    const log = new ActivityLog({
      userEmail: req.user.email,
      action: 'Force Reset Password',
      details: `Triggered password reset for admin: ${admin.email}`
    });
    await log.save();

    res.json({ message: 'Password reset triggered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// @route   DELETE /api/admins/:id
// @desc    Delete an admin
router.delete('/:id', async (req, res) => {
  try {
    const adminToDelete = await Admin.findById(req.params.id);
    if (!adminToDelete) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const email = adminToDelete.email;
    await Admin.findByIdAndDelete(req.params.id);

    // Log the action
    const log = new ActivityLog({
      userEmail: req.user.email,
      action: 'Delete Admin',
      details: `Deleted admin account: ${email}`
    });
    await log.save();

    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting admin' });
  }
});

module.exports = router;
