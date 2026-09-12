const { uploadStream } = require('../utils/cloudinary');
const ActivityLog = require('../models/ActivityLog');

const UploadController = {
  // @desc    Upload image to Cloudinary
  uploadImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file uploaded. Field name must be "image".' });
      }

      const folder = req.body.folder || 'verifitor/uploads';
      const result = await uploadStream(req.file.buffer, folder);

      try {
        await ActivityLog.create({
          userEmail: req.user.email,
          userName: req.user.name || 'User',
          action: 'Image Upload',
          type: 'Upload',
          status: 'Successful',
          details: `Uploaded image to ${folder}`
        });
      } catch (err) {
        console.error('Failed to log image upload:', err);
      }

      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format
      });
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ success: false, message: 'Server error during image upload', error: error.message });
    }
  }
};

module.exports = UploadController;
