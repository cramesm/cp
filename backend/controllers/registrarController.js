const Registrar = require('../models/Registrar');
const Admin = require('../models/Users/Admin');
const ActivityLog = require('../models/ActivityLog');

const RegistrarController = {
  // @desc    Get all registrars and admins
  getAllRegistrars: async (req, res) => {
    try {
      const registrars = await Registrar.find({
        isArchived: { $ne: true },
        status: { $ne: 'Archived' }
      });
      const admins = await Admin.find({
        isArchived: { $ne: true },
        status: { $ne: 'Archived' }
      });

      const combined = [
        ...registrars,
        ...admins.map(a => ({
          ...a.toObject(),
          registrarId: 'ADMIN-' + a._id.toString().substring(0, 4),
          status: a.status || 'Active'
        }))
      ];

      res.json(combined);
    } catch (error) {
      console.error('Error fetching registrars:', error);
      res.status(500).json({ message: 'Error fetching registrars' });
    }
  },

  // @desc    Get single registrar/admin by id
  getRegistrarById: async (req, res) => {
    try {
      let staff = await Registrar.findById(req.params.id);
      let isAdmin = false;
      
      if (!staff) {
        staff = await Admin.findById(req.params.id);
        isAdmin = true;
      }
      
      if (!staff) {
        staff = await Registrar.findOne({ registrarId: req.params.id });
      }

      if (!staff || staff.isArchived || staff.status === 'Archived') {
        return res.status(404).json({ message: 'User not found' });
      }

      let responseData = staff.toObject();
      if (isAdmin) {
        responseData.registrarId = 'ADMIN-' + staff._id.toString().substring(0, 4);
        responseData.status = 'Active';
      }

      res.json(responseData);
    } catch (error) {
      console.error('Error fetching registrar:', error);
      res.status(500).json({ message: 'Error fetching registrar' });
    }
  },

  // @desc    Create new registrar
  createRegistrar: async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      const existingReg = await Registrar.findOne({ email });
      const existingAdmin = await Admin.findOne({ email });
      
      if (existingReg || existingAdmin) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      const registrarId = 'REG-' + Math.floor(100000 + Math.random() * 900000);
      const newRegistrar = await Registrar.create({
        registrarId,
        name,
        email,
        password,
        role: role || 'registrar'
      });

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'Super Admin',
        action: 'User Created',
        type: '------',
        status: 'Successful',
        details: `Created new staff account: ${name} (${email})`
      });

      res.status(201).json({ message: 'Staff created successfully', registrar: newRegistrar });
    } catch (error) {
      console.error('Error creating staff:', error);
      res.status(500).json({ message: 'Error creating staff' });
    }
  },

  // @desc    Update registrar/admin
  updateRegistrar: async (req, res) => {
    try {
      const { name, email, role, status } = req.body;

      let staff = await Registrar.findById(req.params.id);
      let model = Registrar;

      if (!staff) {
        staff = await Admin.findById(req.params.id);
        model = Admin;
      }

      if (!staff) return res.status(404).json({ message: 'User not found' });

      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      if (status) updateData.status = status;

      const updated = await model.findByIdAndUpdate(req.params.id, updateData, { new: true });

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'Super Admin',
        action: 'User Updated',
        type: '------',
        status: 'Successful',
        details: `Updated staff: ${updated.name}`
      });

      res.json(updated);
    } catch (error) {
      console.error('Error updating staff:', error);
      res.status(500).json({ message: 'Error updating staff' });
    }
  },

  // @desc    Archive (soft delete) registrar/admin
  deleteRegistrar: async (req, res) => {
    try {
      let staff = await Registrar.findById(req.params.id);
      let model = Registrar;

      if (!staff) {
        staff = await Admin.findById(req.params.id);
        model = Admin;
      }

      if (!staff) return res.status(404).json({ message: 'User not found' });

      const name = staff.name;
      await model.findByIdAndUpdate(req.params.id, {
        isArchived: true,
        status: 'Archived',
        archivedAt: new Date()
      });

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'Super Admin',
        action: 'User Archived',
        type: '------',
        status: 'Successful',
        details: `Archived staff account: ${name}`
      });

      res.json({ message: 'Staff account archived successfully' });
    } catch (error) {
      console.error('Error archiving staff account:', error);
      res.status(500).json({ message: 'Error archiving staff account' });
    }
  }
};

module.exports = RegistrarController;
