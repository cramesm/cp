const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');

// Temporary: In a real app we would use bcrypt and jsonwebtoken. 
// For this MERN conversion without adding extra complexities unless asked, simple comparison.

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // Hardcode an admin fallback for testing
    if (email === 'admin@verifitor.com' && password === 'admin123') {
       return res.json({ success: true, message: 'Logged in successfully', role: 'admin' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin || admin.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    res.json({ success: true, message: 'Logged in successfully', role: admin.role });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/forgot-password', async (req, res) => {
  // Mock forgot password flow
  res.json({ success: true, message: 'OTP sent to email' });
});

module.exports = router;
