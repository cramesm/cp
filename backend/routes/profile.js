const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { uploadStream } = require('../utils/cloudinary');
const ActivityLog = require('../models/ActivityLog');
const Student = require('../models/Users/Student');
const Alumni = require('../models/Users/Alumni');

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Helper to get user model
const getUserModel = (role) => {
    if (role === 'alumni') return Alumni;
    return Student; // Default to Student for others, though this route is mostly for student/alumni
};

// @route   GET /api/profile
// @desc    Get current user profile
router.get('/', protect, async (req, res) => {
    try {
        const Model = getUserModel(req.user.role);
        const user = await Model.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/profile
// @desc    Update current user profile
router.put('/', protect, async (req, res) => {
    try {
        const { firstName, lastName, phoneNumber, course, yearLevel } = req.body;
        const Model = getUserModel(req.user.role);
        
        const updateFields = {};
        if (firstName) updateFields.firstName = firstName;
        if (lastName) updateFields.lastName = lastName;
        if (phoneNumber) updateFields.phoneNumber = phoneNumber;
        if (course) updateFields.course = course;
        if (yearLevel) updateFields.yearLevel = yearLevel;

        const updatedUser = await Model.findByIdAndUpdate(
            req.user.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select('-password');

        await ActivityLog.create({
            userEmail: req.user.email,
            userName: req.user.name || 'User',
            action: 'Profile Update',
            type: 'Update',
            status: 'Successful',
            details: 'Updated profile information'
        });

        res.json({ success: true, message: 'Profile updated', user: updatedUser });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/profile/upload-photo
// @desc    Upload profile photo
router.post('/upload-photo', protect, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file uploaded' });
        }

        const result = await uploadStream(req.file.buffer, 'verifitor/profile_pictures');
        const profilePicUrl = result.secure_url;

        const Model = getUserModel(req.user.role);
        const updatedUser = await Model.findByIdAndUpdate(
            req.user.id,
            { profilePic: profilePicUrl },
            { new: true }
        ).select('-password');

        await ActivityLog.create({
            userEmail: req.user.email,
            userName: req.user.name || 'User',
            action: 'Profile Picture Upload',
            type: 'Upload',
            status: 'Successful',
            details: 'Updated profile picture'
        });

        res.json({
            success: true,
            message: 'Profile picture updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Profile photo upload error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
