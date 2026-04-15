const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Users/Admin');
const SystemAdmin = require('../models/Users/SystemAdmin');
const Student = require('../models/Users/Student');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/authMiddleware');

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'supersecretverifitor123',
    { expiresIn: '1d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new student/alumni
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, studentId, course, yearLevel, phoneNumber } = req.body;

    // Check if user already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Check if studentId already exists (if provided)
    if (studentId) {
      const existingStudentId = await Student.findOne({ studentId });
      if (existingStudentId) {
        return res.status(400).json({ success: false, message: 'Student ID already registered' });
      }
    }

    // Create new student
    const student = new Student({
      firstName,
      lastName,
      email,
      password,
      role: role || 'student',
      studentId: studentId || '',
      course: course || '',
      yearLevel: yearLevel || '',
      phoneNumber: phoneNumber || ''
    });

    await student.save();

    // Generate token
    const token = generateToken(student);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: student._id,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        role: student.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check Student collection first (for mobile users)
    let user = await Student.findOne({ email });
    let userType = 'student';

    if (!user) {
      // 2. Check SystemAdmin collection
      user = await SystemAdmin.findOne({ email });
      userType = 'system_admin';
    }

    if (!user) {
      // 3. Check Admin collection
      user = await Admin.findOne({ email });
      userType = 'admin';
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
      userName: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
      action: 'Login',
      type: '------',
      status: 'Successful',
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
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name
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

// @route   GET /api/auth/profile
// @desc    Get current user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = req.user; // Provided by protect middleware
    res.json({
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
      firstName: user.firstName,
      lastName: user.lastName,
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
    const { name, firstName, lastName, profilePic, course, yearLevel, phoneNumber } = req.body;

    // Determine which model to use based on role
    let Model;
    if (req.user.role === 'system_admin') {
      Model = SystemAdmin;
    } else if (req.user.role === 'admin') {
      Model = Admin;
    } else {
      Model = Student;
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (profilePic) updateData.profilePic = profilePic;
    if (course) updateData.course = course;
    if (yearLevel) updateData.yearLevel = yearLevel;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;

    const updatedUser = await Model.findByIdAndUpdate(
      req.user.id,
      updateData,
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

    // Determine which model to use based on role
    let Model;
    if (req.user.role === 'system_admin') {
      Model = SystemAdmin;
    } else if (req.user.role === 'admin') {
      Model = Admin;
    } else {
      Model = Student;
    }

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

module.exports = router;
