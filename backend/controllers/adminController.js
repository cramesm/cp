const Admin = require('../models/Users/Admin');
const ActivityLog = require('../models/ActivityLog');

const AdminController = {
  // @desc    Get all admins (without password)
  getAllAdmins: async (req, res) => {
    try {
      const admins = await Admin.find().select('-password');
      res.json(admins);
    } catch (error) {
      console.error('Error fetching admins:', error);
      res.status(500).json({ message: 'Error fetching admins' });
    }
  },

  // @desc    Create new admin
  createAdmin: async (req, res) => {
    try {
      const { email, password, name } = req.body;

      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({ message: 'Admin with this email already exists' });
      }

      const newAdmin = await Admin.create({
        email,
        password,
        name,
        role: 'registrar'
      });

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'Super Admin',
        action: 'Create Admin',
        type: '------',
        status: 'Successful',
        details: `Created new admin account: ${email}`
      });

      res.status(201).json({ message: 'Admin created successfully', admin: newAdmin });
    } catch (error) {
      console.error('Error creating admin:', error);
      res.status(500).json({ message: 'Error creating admin' });
    }
  },

  // @desc    Trigger reset password for admin
  resetAdminPassword: async (req, res) => {
    try {
      const admin = await Admin.findById(req.params.id);
      if (!admin) return res.status(404).json({ message: 'Admin not found' });

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'Super Admin',
        action: 'Force Reset Password',
        type: '------',
        status: 'Successful',
        details: `Triggered password reset for admin: ${admin.email}`
      });

      res.json({ message: 'Password reset triggered successfully' });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: 'Error resetting password' });
    }
  },

  // @desc    Update admin
  updateAdmin: async (req, res) => {
    try {
      const { name, email, role } = req.body;

      const admin = await Admin.findById(req.params.id);
      if (!admin) return res.status(404).json({ message: 'Admin not found' });

      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (role) updateData.role = role;

      const updatedAdmin = await Admin.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'Super Admin',
        action: 'Update Admin',
        type: '------',
        status: 'Successful',
        details: `Updated admin account: ${admin.email}`
      });

      res.json(updatedAdmin);
    } catch (error) {
      console.error('Error updating admin:', error);
      res.status(500).json({ message: 'Error updating admin' });
    }
  },

  // @desc    Delete admin
  deleteAdmin: async (req, res) => {
    try {
      const adminToDelete = await Admin.findById(req.params.id);
      if (!adminToDelete) return res.status(404).json({ message: 'Admin not found' });

      const email = adminToDelete.email;
      await Admin.findByIdAndDelete(req.params.id);

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'Super Admin',
        action: 'Delete Admin',
        type: '------',
        status: 'Successful',
        details: `Deleted admin account: ${email}`
      });

      res.json({ message: 'Admin deleted successfully' });
    } catch (error) {
      console.error('Error deleting admin:', error);
      res.status(500).json({ message: 'Error deleting admin' });
    }
  }
};

module.exports = AdminController;
