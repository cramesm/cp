const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Users/Admin');
const SystemAdmin = require('../models/Users/SystemAdmin');
const ActivityLog = require('../models/ActivityLog');

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'supersecretverifitor123',
    { expiresIn: '1d' }
  );
};

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @route   GET /api/auth/profile
// @desc    Get current user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = req.user; // Provided by protect middleware
    res.json({
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name || 'User',
        profilePic: user.profilePic || ''
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update profile details
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, profilePic } = req.body;
        const Model = req.user.role === 'system_admin' ? SystemAdmin : Admin;
        
        const updatedUser = await Model.findByIdAndUpdate(
            req.user.id,
            { name, profilePic },
            { new: true }
        ).select('-password');

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile' });
    }
});

// @route   PUT /api/auth/change-password
// @desc    Update password
router.put('/change-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const Model = req.user.role === 'system_admin' ? SystemAdmin : Admin;
        const user = await Model.findById(req.user.id);

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) return res.status(400).json({ message: 'Current password incorrect' });

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating password' });
    }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check SystemAdmin collection
    let user = await SystemAdmin.findOne({ email });
    let isSystemAdmin = true;

    if (!user) {
      // 2. Check Admin collection
      user = await Admin.findOne({ email });
      isSystemAdmin = false;
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    // Log activity
    const log = new ActivityLog({
      userEmail: user.email,
      action: 'Login',
      details: `${user.role} logged into the system`
    });
    await log.save();

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/forgot-password', async (req, res) => {
  // Mock forgot password flow
  res.json({ success: true, message: 'OTP sent to email' });
});

module.exports = router;
