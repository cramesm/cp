const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwtConfig');
const nodemailer = require('nodemailer');
const Student = require('../models/Users/Student');
const Alumni = require('../models/Users/Alumni');
const SuperAdmin = require('../models/Users/SuperAdmin');
const Admin = require('../models/Users/Admin');
const Registrar = require('../models/Registrar');
const ActivityLog = require('../models/ActivityLog');
const LoginLockout = require('../models/LoginLockout');
const { sendStaffWelcomeEmail, sendPasswordChangedEmail } = require('../utils/emailService');

// Universal helper to find user across any collection by _id
const findUserById = async (id) => {
  let user = await Registrar.findById(id);
  if (user) return { user, model: Registrar, modelName: 'Registrar' };
  user = await SuperAdmin.findById(id);
  if (user) return { user, model: SuperAdmin, modelName: 'SuperAdmin' };
  user = await Admin.findById(id);
  if (user) return { user, model: Admin, modelName: 'Admin' };
  user = await Student.findById(id);
  if (user) return { user, model: Student, modelName: 'Student' };
  user = await Alumni.findById(id);
  if (user) return { user, model: Alumni, modelName: 'Alumni' };
  return { user: null, model: null, modelName: '' };
};

// Universal helper to find user across any collection by email (case-insensitive & regex-safe)
const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const findUserByEmail = async (email) => {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return { user: null, model: null, modelName: '' };
  const query = { email: new RegExp(`^${escapeRegex(cleanEmail)}$`, 'i') };
  let user = await Registrar.findOne(query);
  if (user) return { user, model: Registrar, modelName: 'Registrar' };
  user = await SuperAdmin.findOne(query);
  if (user) return { user, model: SuperAdmin, modelName: 'SuperAdmin' };
  user = await Admin.findOne(query);
  if (user) return { user, model: Admin, modelName: 'Admin' };
  user = await Student.findOne(query);
  if (user) return { user, model: Student, modelName: 'Student' };
  user = await Alumni.findOne(query);
  if (user) return { user, model: Alumni, modelName: 'Alumni' };
  return { user: null, model: null, modelName: '' };
};

// In-memory OTP store: { email: { otp, expiresAt, modelName } }
const otpStore = {};

// Temporary store for registration OTPs
const registrationOtpStore = {};

// Nodemailer transporter (Gmail or custom SMTP)
const smtpUser = process.env.SMTP_USER || process.env.SMTP_EMAIL;
const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

// Helper to generate JWT
const generateToken = (user) => {
  const signOptions = {};
  if (process.env.JWT_ACCESS_TTL_MINUTES) {
    signOptions.expiresIn = `${process.env.JWT_ACCESS_TTL_MINUTES}m`;
  } else {
    signOptions.expiresIn = '1d';
  }
  if (process.env.JWT_ISSUER) {
    signOptions.issuer = process.env.JWT_ISSUER;
  }
  if (process.env.JWT_AUDIENCE) {
    signOptions.audience = process.env.JWT_AUDIENCE;
  }

  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      department: user.department || '',
      name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
    },
    JWT_SECRET,
    signOptions
  );
};

const AuthController = {
  // @desc    Check if email is available
  checkEmailAvailability: async (req, res) => {
    try {
      const email = (req.query.email || '').trim().toLowerCase();
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email query parameter is required' });
      }

      const { user } = await findUserByEmail(email);
      if (user) {
        return res.json({ success: true, available: false, message: 'This email is already in use.' });
      }
      return res.json({ success: true, available: true, message: 'Email is available.' });
    } catch (err) {
      console.error('Check email availability error:', err);
      return res.status(500).json({ success: false, message: 'Error checking email availability' });
    }
  },

  // @desc    Register a new staff/department member from Login page
  registerStaff: async (req, res) => {
    try {
      const { firstName, lastName, email, department } = req.body;
      if (!firstName || !lastName || !email || !department) {
        return res.status(400).json({ success: false, message: 'First name, last name, email, and department are required' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const { user: existing } = await findUserByEmail(cleanEmail);
      if (existing) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }

      // Generate a secure, clean 9-character temporary password without ambiguous characters
      const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // omitted I, O
      const lowers = "abcdefghijkmnopqrstuvwxyz"; // omitted l
      const digits = "23456789"; // omitted 0, 1
      const specials = "!@#$*";

      let tempPassword = "";
      tempPassword += uppers.charAt(Math.floor(Math.random() * uppers.length));
      tempPassword += lowers.charAt(Math.floor(Math.random() * lowers.length));
      tempPassword += lowers.charAt(Math.floor(Math.random() * lowers.length));
      tempPassword += digits.charAt(Math.floor(Math.random() * digits.length));
      tempPassword += digits.charAt(Math.floor(Math.random() * digits.length));
      tempPassword += specials.charAt(Math.floor(Math.random() * specials.length));
      const pool = uppers + lowers + digits;
      for (let i = 0; i < 3; i++) {
        tempPassword += pool.charAt(Math.floor(Math.random() * pool.length));
      }
      tempPassword = tempPassword.split('').sort(() => 0.5 - Math.random()).join('');

      // Determine default role based on department
      let role = 'Registrar Staff';
      if (department.toLowerCase().includes('accounting')) {
        role = 'Accounting Staff';
      } else if (department.toLowerCase().includes('it')) {
        role = 'IT Administrator';
      } else {
        role = 'Registrar Staff';
      }

      const deptPrefix = department.substring(0, 3).toUpperCase();
      const registrarId = `${deptPrefix}-${Math.floor(100000 + Math.random() * 900000)}`;
      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      const newStaff = await Registrar.create({
        registrarId,
        name: fullName,
        email: cleanEmail,
        password: tempPassword,
        department,
        role,
        status: 'Active',
        mustChangePassword: true
      });

      // Send email with credentials (no OTP needed)
      try {
        await sendStaffWelcomeEmail({
          to: cleanEmail,
          name: fullName,
          email: cleanEmail,
          tempPassword,
          department,
          role
        });
      } catch (mailErr) {
        console.error('Failed to dispatch welcome email:', mailErr);
      }

      await ActivityLog.create({
        userEmail: cleanEmail,
        userName: fullName,
        action: 'Account Self-Registration',
        type: 'Auth',
        status: 'Successful',
        details: `Created new staff account for ${fullName} (${cleanEmail}) in ${department}`
      });

      res.status(201).json({
        success: true,
        message: 'Account created successfully! Your temporary password has been emailed to you.',
        tempPassword,
        user: {
          id: newStaff._id,
          name: newStaff.name,
          email: newStaff.email,
          role: newStaff.role,
          department: newStaff.department
        }
      });
    } catch (err) {
      console.error('Staff registration error:', err);
      res.status(500).json({ success: false, message: 'Server error creating account' });
    }
  },

  // @desc    Request OTP for registration
  requestRegisterOTP: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

      // Check if email is already in use
      const student = await Student.findOne({ email });
      const alumni = await Alumni.findOne({ email });
      const superAdmin = await SuperAdmin.findOne({ email });
      const registrar = await Registrar.findOne({ email });

      if (student || alumni || superAdmin || registrar) {
        return res.status(400).json({ success: false, message: 'Email is already registered' });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpTtlMinutes = Number(process.env.OTP_TTL_MINUTES) || 10;
      const expiresAt = Date.now() + otpTtlMinutes * 60 * 1000;
      
      registrationOtpStore[email] = { otp, expiresAt };

      if (process.env.OTP_DEV_MODE === 'true') {
        console.log(`[OTP_DEV_MODE] Registration OTP for ${email}: ${otp}`);
      }

      const emailSender = process.env.SMTP_FROM || `"VeriFitor System" <${smtpUser || 'verifitor@gmail.com'}>`;
      await transporter.sendMail({
        from: emailSender,
        to: email,
        subject: 'VeriFitor - Registration OTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2f3947;">Registration OTP</h2>
            <p>Use the OTP below to complete your registration:</p>
            <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2f3947;">${otp}</span>
            </div>
            <p style="color: #666;">This OTP expires in <strong>${otpTtlMinutes} minutes</strong>.</p>
          </div>
        `
      });

      res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
      console.error('Request OTP error:', error);
      res.status(500).json({ success: false, message: 'Error sending OTP' });
    }
  },

  // @desc    Verify OTP and register user
  verifyRegisterOTP: async (req, res) => {
    try {
      const { email, otp, firstName, lastName, password, role, studentId, course, yearLevel, phoneNumber } = req.body;
      
      const stored = registrationOtpStore[email];
      if (!stored || Date.now() > stored.expiresAt || stored.otp !== otp) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      }

      // Check again to avoid race conditions
      const existingStudent = await Student.findOne({ email });
      const existingAlumni = await Alumni.findOne({ email });
      if (existingStudent || existingAlumni) {
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

      const user = await UserModel.create({
        firstName,
        lastName,
        email,
        password,
        role: role || 'student',
        studentId: studentId || null,
        course: course || '',
        yearLevel: yearLevel || '',
        phoneNumber: phoneNumber || ''
      });

      delete registrationOtpStore[email];

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
          phoneNumber: user.phoneNumber || '',
          profilePic: user.profilePic || ''
        }
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // @desc    Register a new student/alumni directly
  register: async (req, res) => {
    try {
      const { firstName, lastName, email, password, role, studentId, course, yearLevel, phoneNumber } = req.body;

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

      const user = await UserModel.create({
        firstName,
        lastName,
        email,
        password,
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
  },

  // @desc    Authenticate user and get token
  login: async (req, res) => {
    try {
      const rawEmail = (req.body.email || '').trim();
      const rawPassword = req.body.password || '';
      const cleanEmail = rawEmail.toLowerCase();
      const cleanPassword = rawPassword.trim();

      if (!cleanEmail || !rawPassword) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }

      // Universal search across Registrar, SuperAdmin, Admin, Student, Alumni
      const { user, modelName } = await findUserByEmail(cleanEmail);

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      // Check account status
      if (user.isArchived || (user.status && user.status.toLowerCase() === 'archived')) {
        return res.status(403).json({ success: false, message: 'This account has been archived. Please contact an administrator.' });
      }

      if (user.status && ['inactive', 'stopped'].includes(user.status.toLowerCase())) {
        return res.status(403).json({ success: false, message: 'Account is currently inactive. Please contact an administrator.' });
      }

      // Check password: test trimmed first, and raw if trimmed fails (protects against accidental whitespace)
      let isMatch = await user.comparePassword(cleanPassword);
      if (!isMatch && rawPassword !== cleanPassword) {
        isMatch = await user.comparePassword(rawPassword);
      }
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = generateToken(user);
      const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || req.ip || '127.0.0.1';

      if (modelName === 'Registrar') {
        try {
          await Registrar.findByIdAndUpdate(user._id, {
            lastLoginIp: clientIp,
            lastLoginAt: new Date()
          });
        } catch (ipErr) {
          console.error('Error updating registrar last login IP:', ipErr);
        }
      }

      // Log activity
      await ActivityLog.create({
        userEmail: user.email,
        userName: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        action: 'Login',
        type: '------',
        status: 'Successful',
        details: `${user.role} logged into the system from IP ${clientIp}`,
        ipAddress: clientIp
      });

      // Clear lockout record
      if (req.clientIp || clientIp) {
        await LoginLockout.deleteOne({ ip: req.clientIp || clientIp });
      }

      res.json({
        success: true,
        message: 'Logged in successfully',
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          department: user.department || '',
          mustChangePassword: user.mustChangePassword || false,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          studentId: user.studentId || '',
          course: user.course || '',
          yearLevel: user.yearLevel || '',
          phoneNumber: user.phoneNumber || '',
          profilePic: user.profilePic || ''
        }
      });
    } catch (error) {
      console.error('Login error:', error.message);
      console.error('Login error stack:', error.stack);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // @desc    Log out user and record activity
  logout: async (req, res) => {
    try {
      let user = null;
      let token;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }
      if (token) {
        try {
          user = jwt.verify(token, JWT_SECRET);
        } catch (jwtErr) {
          console.warn('Logout token verification warning:', jwtErr.message);
        }
      }

      const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || req.ip || '127.0.0.1';
      const userName = user?.name || req.body?.userName || 'User';
      const userEmail = user?.email || req.body?.userEmail || 'N/A';
      const userRole = user?.role || req.body?.userRole || 'User';

      await ActivityLog.create({
        userEmail: userEmail,
        userName: userName,
        action: 'Logout',
        type: '------',
        status: 'Successful',
        details: `${userRole} (${userName}) logged out of the system from IP ${clientIp}`,
        ipAddress: clientIp
      });

      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ success: false, message: 'Server error during logout' });
    }
  },

  // @desc    Initiate forgot password request with OTP
  forgotPassword: async (req, res) => {
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
      const otpTtlMinutes = Number(process.env.OTP_TTL_MINUTES) || 10;
      const expiresAt = Date.now() + otpTtlMinutes * 60 * 1000;

      otpStore[email] = { otp, expiresAt, modelName };

      if (process.env.OTP_DEV_MODE === 'true') {
        console.log(`[OTP_DEV_MODE] Password Reset OTP for ${email}: ${otp}`);
      }

      const emailSender = process.env.SMTP_FROM || `"VeriFitor System" <${smtpUser || 'verifitor@gmail.com'}>`;
      await transporter.sendMail({
        from: emailSender,
        to: email,
        subject: 'VeriFitor - Password Reset OTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2f3947;">Password Reset Request</h2>
            <p>You requested to reset your password. Use the OTP below:</p>
            <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2f3947;">${otp}</span>
            </div>
            <p style="color: #666;">This OTP expires in <strong>${otpTtlMinutes} minutes</strong>.</p>
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
  },

  // @desc    Verify OTP for password reset
  verifyPasswordResetOTP: async (req, res) => {
    try {
      const { email, otp } = req.body;
      const stored = otpStore[email];
      if (!stored || Date.now() > stored.expiresAt || stored.otp !== otp) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      }

      const resetToken = jwt.sign(
        { email, modelName: stored.modelName },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      delete otpStore[email];
      res.json({ success: true, message: 'OTP verified successfully', resetToken });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // @desc    Reset password using verified resetToken
  resetPassword: async (req, res) => {
    try {
      const { resetToken, newPassword, password } = req.body;
      const decoded = jwt.verify(resetToken, JWT_SECRET);
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
  },

  // @desc    Get authenticated user profile
  getProfile: async (req, res) => {
    try {
      const { user } = await findUserById(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      res.json({
        id: user._id,
        email: user.email,
        role: user.role,
        department: user.department || '',
        mustChangePassword: user.mustChangePassword || false,
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
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // @desc    Update authenticated user profile
  updateProfile: async (req, res) => {
    try {
      const { name, firstName, lastName, profilePic, course, yearLevel, phoneNumber, department } = req.body;
      const { user, model } = await findUserById(req.user.id);
      if (!user || !model) return res.status(404).json({ message: 'User not found' });

      const updateData = {};
      if (name) {
        updateData.name = name;
        if (user.role === 'student' || user.role === 'alumni') {
          const parts = name.trim().split(' ');
          updateData.firstName = parts[0];
          updateData.lastName = parts.slice(1).join(' ') || ' ';
        }
      }
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (profilePic) updateData.profilePic = profilePic;
      if (course) updateData.course = course;
      if (yearLevel) updateData.yearLevel = yearLevel;
      if (phoneNumber) updateData.phoneNumber = phoneNumber;
      if (department) updateData.department = department;

      const updatedUser = await model.findByIdAndUpdate(req.user.id, updateData, { new: true });
      res.json(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Error updating profile' });
    }
  },

  // @desc    Change password for authenticated user
  changePassword: async (req, res) => {
    try {
      const rawCurrent = req.body.currentPassword || '';
      const rawNew = req.body.newPassword || '';
      const cleanCurrent = rawCurrent.trim();
      const cleanNew = rawNew.trim();

      if (!cleanCurrent || !cleanNew) {
        return res.status(400).json({ message: 'Current password and new password are required' });
      }

      if (cleanNew.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long' });
      }

      const { user } = await findUserById(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      let isMatch = await user.comparePassword(cleanCurrent);
      if (!isMatch && rawCurrent !== cleanCurrent) {
        isMatch = await user.comparePassword(rawCurrent);
      }
      if (!isMatch) return res.status(400).json({ message: 'Current password incorrect' });

      user.password = cleanNew;
      if ('mustChangePassword' in user) {
        user.mustChangePassword = false;
      }
      await user.save();

      // Dispatch security email
      try {
        await sendPasswordChangedEmail({
          to: user.email,
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
        });
      } catch (mailErr) {
        console.error('Failed to dispatch password changed email:', mailErr);
      }

      await ActivityLog.create({
        userEmail: user.email,
        userName: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        action: 'Change Password',
        type: 'Auth',
        status: 'Successful',
        details: `Password changed successfully for ${user.email}`
      });

      res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Error updating password' });
    }
  }
};

module.exports = AuthController;
