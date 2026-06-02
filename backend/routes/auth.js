const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const Student = require('../models/Users/Student');
const Alumni = require('../models/Users/Alumni');
const SuperAdmin = require('../models/Users/SuperAdmin');
const Registrar = require('../models/Registrar');
const ActivityLog = require('../models/ActivityLog');

// In-memory OTP store: { email: { otp, expiresAt, modelName } }
const otpStore = {};

// Nodemailer transporter (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User' },
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

    if (studentId) {
      const existingIdStudent = await Student.findOne({ studentId });
      const existingIdAlumni = await Alumni.findOne({ studentId });
      if (existingIdStudent || existingIdAlumni) {
        return res.status(400).json({ success: false, message: 'Student ID already registered' });
      }
    }

    const isAlumni = role === 'alumni';
    const UserModel = isAlumni ? Alumni : Student;

    // Create new user
    const user = await UserModel.create({
      firstName,
      lastName,
      email,
      password, // Model pre-save hook hashes this
      role: role || 'student',
      studentId: studentId || null,
      course: course || '',
      yearLevel: yearLevel || '',
      phoneNumber: phoneNumber || ''
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        studentId: user.studentId || '',
        course: user.course || '',
        yearLevel: user.yearLevel || '',
        phoneNumber: user.phoneNumber || ''
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

    let user = null;
    let modelName = '';

    // 1. Check Student
    user = await Student.findOne({ email });
    if (user) modelName = 'Student';

    // 1.5 Check Alumni
    if (!user) {
      user = await Alumni.findOne({ email });
      if (user) modelName = 'Alumni';
    }

    // 2. Check SuperAdmin
    if (!user) {
      user = await SuperAdmin.findOne({ email });
      if (user) modelName = 'SuperAdmin';
    }

    // 3. Check Registrar
    if (!user) {
      user = await Registrar.findOne({ email });
      if (user) modelName = 'Registrar';
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check account status
    if (user.status === 'Inactive') {
      return res.status(403).json({ success: false, message: 'Account is currently inactive. Please contact an administrator.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    // Log activity
    await ActivityLog.create({
      userEmail: user.email,
      userName: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
      action: 'Login',
      type: '------',
      status: 'Successful',
      details: `${user.role} logged into the system`
    });

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
        name: user.name,
        studentId: user.studentId || '',
        course: user.course || '',
        yearLevel: user.yearLevel || '',
        phoneNumber: user.phoneNumber || ''
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    console.error('Login error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    let user = null;
    let modelName = '';

    user = await Student.findOne({ email });
    if (user) modelName = 'Student';
    
    if (!user) {
      user = await Alumni.findOne({ email });
      if (user) modelName = 'Alumni';
    }

    if (!user) {
      user = await SuperAdmin.findOne({ email });
      if (user) modelName = 'SuperAdmin';
    }

    if (!user) {
      user = await Registrar.findOne({ email });
      if (user) modelName = 'Registrar';
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with that email' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    otpStore[email] = { otp, expiresAt, modelName };

    await transporter.sendMail({
      from: `"VeriFitor System" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: 'VeriFitor - Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2f3947;">Password Reset Request</h2>
          <p>You requested to reset your password. Use the OTP below:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2f3947;">${otp}</span>
          </div>
          <p style="color: #666;">This OTP expires in <strong>10 minutes</strong>.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 11px; text-align: center;">VeriFitor — Document Verification System</p>
        </div>
      `
    });

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Error sending OTP email' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const stored = otpStore[email];
    if (!stored || Date.now() > stored.expiresAt || stored.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const resetToken = jwt.sign(
      { email, modelName: stored.modelName },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    delete otpStore[email];
    res.json({ success: true, message: 'OTP verified successfully', resetToken });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword, password } = req.body;
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    const { email, modelName } = decoded;

    const targetPassword = newPassword || password;
    if (!targetPassword) {
      return res.status(400).json({ success: false, message: 'New password is required' });
    }

    let userModel;
    if (modelName === 'Student') userModel = Student;
    else if (modelName === 'Alumni') userModel = Alumni;
    else if (modelName === 'SuperAdmin') userModel = SuperAdmin;
    else userModel = Registrar;

    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.password = targetPassword;
    await user.save();

    await ActivityLog.create({
      userEmail: email,
      userName: 'User',
      action: 'Password Reset',
      type: '------',
      status: 'Successful',
      details: `Password reset completed for ${email}`
    });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ success: false, message: 'Error resetting password' });
  }
});

router.get('/profile', protect, async (req, res) => {
  try {
    let user = null;
    if (req.user.role === 'super admin') {
      user = await SuperAdmin.findById(req.user.id);
    } else if (req.user.role === 'registrar') {
      user = await Registrar.findById(req.user.id);
    } else if (req.user.role === 'alumni') {
      user = await Alumni.findById(req.user.id);
    } else {
      user = await Student.findById(req.user.id);
    }

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
      firstName: user.firstName,
      lastName: user.lastName,
      profilePic: user.profilePic || '',
      studentId: user.studentId || '',
      course: user.course || '',
      yearLevel: user.yearLevel || '',
      phoneNumber: user.phoneNumber || ''
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/profile', protect, async (req, res) => {
  try {
    const { name, firstName, lastName, profilePic, course, yearLevel, phoneNumber } = req.body;
    
    let userModel;
    if (req.user.role === 'super admin') userModel = SuperAdmin;
    else if (req.user.role === 'registrar') userModel = Registrar;
    else if (req.user.role === 'alumni') userModel = Alumni;
    else userModel = Student;

    const updateData = {};
    if (name) updateData.name = name;
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (profilePic) updateData.profilePic = profilePic;
    if (course) updateData.course = course;
    if (yearLevel) updateData.yearLevel = yearLevel;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;

    const updatedUser = await userModel.findByIdAndUpdate(req.user.id, updateData, { new: true });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile' });
  }
});

router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    let userModel;
    if (req.user.role === 'super admin') userModel = SuperAdmin;
    else if (req.user.role === 'registrar') userModel = Registrar;
    else if (req.user.role === 'alumni') userModel = Alumni;
    else userModel = Student;

    const user = await userModel.findById(req.user.id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password incorrect' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating password' });
  }
});

// --- Multer Configuration for Profile Photos ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'profiles'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${ext}`);
  }
});

const uploadProfile = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPG and JPEG image files are allowed.'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// @route   POST /api/auth/profile/photo
// @desc    Upload profile photo
router.post('/profile/photo', protect, uploadProfile.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No photo uploaded' });
    }

    let userModel;
    if (req.user.role === 'super admin') userModel = SuperAdmin;
    else if (req.user.role === 'registrar') userModel = Registrar;
    else if (req.user.role === 'alumni') userModel = Alumni;
    else userModel = Student;

    const profilePicUrl = `/uploads/profiles/${req.file.filename}`;

    const updatedUser = await userModel.findByIdAndUpdate(
      req.user.id,
      { profilePic: profilePicUrl },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Profile photo updated successfully',
      profile: {
        email: updatedUser.email,
        profilePic: updatedUser.profilePic,
        name: updatedUser.name || `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim(),
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        studentId: updatedUser.studentId,
        course: updatedUser.course,
        yearLevel: updatedUser.yearLevel,
        phoneNumber: updatedUser.phoneNumber
      }
    });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    res.status(500).json({ success: false, message: 'Error uploading profile photo' });
  }
});

module.exports = router;
