const { uploadStream } = require('../utils/cloudinary');
const ActivityLog = require('../models/ActivityLog');
const Student = require('../models/Users/Student');
const Alumni = require('../models/Users/Alumni');

// Helper to get user model
const getUserModel = (role) => {
  if (role === 'alumni') return Alumni;
  return Student;
};

const ProfileController = {
  // @desc    Get current user profile
  getProfile: async (req, res) => {
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
  },

  // @desc    Update current user profile
  updateProfile: async (req, res) => {
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
  },

  // @desc    Upload profile photo
  uploadPhoto: async (req, res) => {
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
  }
};

module.exports = ProfileController;
