const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const supabase = require('../supabaseClient');
const { protect } = require('../middleware/authMiddleware');

// In-memory OTP store: { email: { otp, expiresAt } }
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
    { id: user.id, email: user.email, role: user.role },
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
    const { data: existingStudent } = await supabase
      .from('students').select('id').eq('email', email).single();
    if (existingStudent) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Check if studentId already exists (if provided)
    if (studentId) {
      const { data: existingId } = await supabase
        .from('students').select('id').eq('student_id', studentId).single();
      if (existingId) {
        return res.status(400).json({ success: false, message: 'Student ID already registered' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new student
    const { data: student, error } = await supabase.from('students').insert({
      first_name: firstName,
      last_name: lastName,
      email,
      password: hashedPassword,
      role: role || 'student',
      student_id: studentId || null,
      course: course || '',
      year_level: yearLevel || '',
      phone_number: phoneNumber || ''
    }).select().single();

    if (error) throw error;

    const token = generateToken(student);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: student.id,
        email: student.email,
        firstName: student.first_name,
        lastName: student.last_name,
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

    let user = null;
    let userType = '';

    // 1. Check Student collection first
    const { data: student } = await supabase
      .from('students').select('*').eq('email', email).single();
    if (student) { user = student; userType = 'student'; }

    // 2. Check SystemAdmin collection
    if (!user) {
      const { data: sysAdmin } = await supabase
        .from('system_admins').select('*').eq('email', email).single();
      if (sysAdmin) { user = sysAdmin; userType = 'system_admin'; }
    }

    // 3. Check Admin collection
    if (!user) {
      const { data: admin } = await supabase
        .from('admins').select('*').eq('email', email).single();
      if (admin) { user = admin; userType = 'registrar'; }
    }

    // 4. Check Registrars collection
    if (!user) {
      const { data: registrar } = await supabase
        .from('registrars').select('*').eq('email', email).single();
      if (registrar) { user = registrar; userType = 'registrar'; }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check for password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    // Log activity
    await supabase.from('activity_logs').insert({
      user_email: user.email,
      user_name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User',
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
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    // Check if email exists in any user table
    let user = null;
    let tableName = '';

    const { data: student } = await supabase.from('students').select('id, email').eq('email', email).single();
    if (student) { user = student; tableName = 'students'; }

    if (!user) {
      const { data: sysAdmin } = await supabase.from('system_admins').select('id, email').eq('email', email).single();
      if (sysAdmin) { user = sysAdmin; tableName = 'system_admins'; }
    }

    if (!user) {
      const { data: admin } = await supabase.from('admins').select('id, email').eq('email', email).single();
      if (admin) { user = admin; tableName = 'admins'; }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with that email' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore[email] = { otp, expiresAt, tableName };

    // Send OTP email
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
          <p style="color: #999; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 11px; text-align: center;">VeriFitor — Document Verification System</p>
        </div>
      `
    });

    console.log(`OTP sent to ${email}: ${otp}`);
    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Error sending OTP email' });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify the OTP code
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    const stored = otpStore[email];
    if (!stored) {
      return res.status(400).json({ success: false, message: 'No OTP request found for this email. Please request a new one.' });
    }

    if (Date.now() > stored.expiresAt) {
      delete otpStore[email];
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    // OTP is valid — generate a short-lived reset token
    const resetToken = jwt.sign(
      { email, tableName: stored.tableName },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    delete otpStore[email];
    res.json({ success: true, message: 'OTP verified successfully', resetToken });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using the reset token from verify-otp
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'Reset token and new password are required' });
    }

    // Verify the reset token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    const { email, tableName } = decoded;

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { error } = await supabase.from(tableName).update({ password: hashedPassword }).eq('email', email);
    if (error) throw error;

    // Log activity
    await supabase.from('activity_logs').insert({
      user_email: email,
      user_name: 'User',
      action: 'Password Reset',
      type: '------',
      status: 'Successful',
      details: `Password reset completed for ${email}`
    });

    res.json({ success: true, message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ success: false, message: 'Reset token expired. Please request a new OTP.' });
    }
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Error resetting password' });
  }
});

// @route   GET /api/auth/profile
router.get('/profile', protect, async (req, res) => {
  try {
    // Fetch full user data from the appropriate table based on role
    let user = null;
    if (req.user.role === 'system admin') {
      const { data } = await supabase.from('system_admins').select('*').eq('id', req.user.id).single();
      user = data;
    } else if (req.user.role === 'registrar') {
      const { data } = await supabase.from('admins').select('*').eq('id', req.user.id).single();
      user = data;
    } else {
      const { data } = await supabase.from('students').select('*').eq('id', req.user.id).single();
      user = data;
    }

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User',
      firstName: user.first_name,
      lastName: user.last_name,
      profilePic: user.profile_pic || ''
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, firstName, lastName, profilePic, course, yearLevel, phoneNumber } = req.body;

    let tableName;
    if (req.user.role === 'system admin') tableName = 'system_admins';
    else if (req.user.role === 'registrar') tableName = 'admins';
    else tableName = 'students';

    const updateData = {};
    if (name) updateData.name = name;
    if (firstName) updateData.first_name = firstName;
    if (lastName) updateData.last_name = lastName;
    if (profilePic) updateData.profile_pic = profilePic;
    if (course) updateData.course = course;
    if (yearLevel) updateData.year_level = yearLevel;
    if (phoneNumber) updateData.phone_number = phoneNumber;

    const { data: updatedUser, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', req.user.id)
      .select('id, email, role, name, first_name, last_name, profile_pic, course, year_level, phone_number')
      .single();

    if (error) throw error;
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// @route   PUT /api/auth/change-password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    let tableName;
    if (req.user.role === 'system admin') tableName = 'system_admins';
    else if (req.user.role === 'registrar') tableName = 'admins';
    else tableName = 'students';

    const { data: user, error } = await supabase
      .from(tableName).select('*').eq('id', req.user.id).single();
    if (error) throw error;

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password incorrect' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await supabase.from(tableName).update({ password: hashedPassword }).eq('id', req.user.id);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating password' });
  }
});

module.exports = router;
