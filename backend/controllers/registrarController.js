const Registrar = require('../models/Registrar');
const Admin = require('../models/Users/Admin');
const ActivityLog = require('../models/ActivityLog');
const { sendStaffWelcomeEmail, sendAccountStatusEmail, sendRoleChangeEmail } = require('../utils/emailService');

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

  // @desc    Create new registrar/staff
  createRegistrar: async (req, res) => {
    try {
      const { name, email, password, role, department } = req.body;

      const existingReg = await Registrar.findOne({ email });
      const existingAdmin = await Admin.findOne({ email });
      
      if (existingReg || existingAdmin) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      const assignedDept = department || (
        (role && role.toLowerCase().includes('accounting')) ? 'Accounting' :
        (role && role.toLowerCase().includes('it')) ? 'IT Administration' : 'Registrar'
      );

      const requesterRole = (req.user?.role || '').toLowerCase();
      let assignedRole = role || (
        assignedDept === 'Accounting' ? 'Accounting Staff' :
        assignedDept === 'IT Administration' ? 'IT Administrator' : 'Registrar Staff'
      );

      // Only Super Admin can appoint Admin roles (Registrar Admin, Accounting Admin, Super Admin)
      if (
        (assignedRole.toLowerCase().includes('admin') && assignedRole.toLowerCase() !== 'it administrator') &&
        requesterRole !== 'super admin'
      ) {
        assignedRole = assignedDept === 'Accounting' ? 'Accounting Staff' : 
                       assignedDept === 'IT Administration' ? 'IT Administrator' : 'Registrar Staff';
      }

      const registrarId = 'REG-' + Math.floor(100000 + Math.random() * 900000);
      const newRegistrar = await Registrar.create({
        registrarId,
        name,
        email,
        password,
        role: assignedRole,
        department: assignedDept,
        status: 'Active',
        mustChangePassword: true
      });

      // Send welcome email with credentials & department info
      try {
        await sendStaffWelcomeEmail({
          to: email,
          name,
          email,
          tempPassword: password,
          department: assignedDept,
          role: newRegistrar.role
        });
      } catch (emailErr) {
        console.error('Failed to send staff welcome email:', emailErr);
      }

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'Super Admin',
        action: 'User Created',
        type: '------',
        status: 'Successful',
        details: `Created new staff account: ${name} (${email}) - Role: ${newRegistrar.role}, Dept: ${assignedDept}`
      });

      res.status(201).json({ message: 'Staff created successfully and credentials emailed', registrar: newRegistrar });
    } catch (error) {
      console.error('Error creating staff:', error);
      res.status(500).json({ message: 'Error creating staff' });
    }
  },

  // @desc    Update registrar/admin
  updateRegistrar: async (req, res) => {
    try {
      const { name, email, role, status, department } = req.body;
      const requesterRole = (req.user?.role || '').toLowerCase();

      let staff = await Registrar.findById(req.params.id);
      let model = Registrar;

      if (!staff) {
        staff = await Admin.findById(req.params.id);
        model = Admin;
      }

      if (!staff) return res.status(404).json({ message: 'User not found' });

      // Department boundary enforcement: Department Admins can only manage staff within their own department
      const requesterDept = (req.user?.department || '').toLowerCase();
      const targetDept = (staff.department || '').toLowerCase();
      const isITOrSuper = requesterRole === 'super admin' || requesterRole.includes('it admin') || requesterRole.includes('it administrator');
      if (!isITOrSuper) {
        if (requesterDept && targetDept && requesterDept !== targetDept) {
          return res.status(403).json({
            message: `Department Boundary Violation: As a ${req.user.role}, you can only manage staff members within the ${req.user.department} department.`
          });
        }
      }

      // Only Super Admin can change staff roles (promote/demote)
      if (role && role !== oldRole) {
        if (requesterRole !== 'super admin') {
          return res.status(403).json({
            message: 'Only Super Admin has the authority to appoint, promote, or demote staff roles.'
          });
        }
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      if (status) updateData.status = status;
      if (department) updateData.department = department;

      const updated = await model.findByIdAndUpdate(req.params.id, updateData, { new: true });

      // Notify user via email if status toggled
      if (status && status !== oldStatus) {
        try {
          await sendAccountStatusEmail({
            to: updated.email,
            name: updated.name,
            status: updated.status
          });
        } catch (emailErr) {
          console.error('Failed to send status update email:', emailErr);
        }
      }

      // Notify user via email if role changed (Promote / Demote)
      if (role && role !== oldRole) {
        const isPromotion = 
          (oldRole?.toLowerCase().includes('staff') && role?.toLowerCase().includes('admin')) ||
          (role?.toLowerCase().includes('admin') && !oldRole?.toLowerCase().includes('admin'));

        const isDemotion = 
          (oldRole?.toLowerCase().includes('admin') && role?.toLowerCase().includes('staff')) ||
          (oldRole?.toLowerCase().includes('admin') && !role?.toLowerCase().includes('admin'));

        try {
          await sendRoleChangeEmail({
            to: updated.email,
            name: updated.name,
            oldRole,
            newRole: updated.role,
            isPromotion
          });
        } catch (roleMailErr) {
          console.error('Failed to send role change email:', roleMailErr);
        }

        await ActivityLog.create({
          userEmail: req.user.email,
          userName: req.user.name || 'Super Admin',
          action: isPromotion ? 'Staff Role Promoted' : isDemotion ? 'Staff Role Demoted' : 'Role Updated',
          type: 'Auth',
          status: 'Successful',
          details: `${req.user.name || 'Super Admin'} ${isPromotion ? 'promoted' : isDemotion ? 'demoted' : 'updated'} ${updated.name} from "${oldRole}" to "${updated.role}"`
        });
      } else {
        await ActivityLog.create({
          userEmail: req.user.email,
          userName: req.user.name || 'Super Admin',
          action: 'User Updated',
          type: '------',
          status: 'Successful',
          details: `Updated staff: ${updated.name} (Status: ${updated.status || 'Active'})`
        });
      }

      res.json(updated);
    } catch (error) {
      console.error('Error updating staff:', error);
      res.status(500).json({ message: 'Error updating staff' });
    }
  },

  // @desc    Promote or Demote staff role (Super Admin Only)
  // @route   PUT /api/registrars/:id/role
  updateRole: async (req, res) => {
    try {
      const requesterRole = (req.user?.role || '').toLowerCase();
      if (requesterRole !== 'super admin') {
        return res.status(403).json({
          message: 'Only Super Admin has the authority to appoint, promote, or demote administrator roles.'
        });
      }

      const { role } = req.body;
      if (!role) {
        return res.status(400).json({ message: 'Target role is required.' });
      }

      let staff = await Registrar.findById(req.params.id);
      let model = Registrar;

      if (!staff) {
        staff = await Admin.findById(req.params.id);
        model = Admin;
      }

      if (!staff) return res.status(404).json({ message: 'Staff member not found.' });

      const oldRole = staff.role;
      if (oldRole === role) {
        return res.status(400).json({ message: `Staff member is already assigned as ${role}.` });
      }

      const isPromotion = 
        (oldRole?.toLowerCase().includes('staff') && role?.toLowerCase().includes('admin')) ||
        (role?.toLowerCase().includes('admin') && !oldRole?.toLowerCase().includes('admin'));

      const isDemotion = 
        (oldRole?.toLowerCase().includes('admin') && role?.toLowerCase().includes('staff')) ||
        (oldRole?.toLowerCase().includes('admin') && !role?.toLowerCase().includes('admin'));

      const updated = await model.findByIdAndUpdate(req.params.id, { role }, { new: true });

      try {
        await sendRoleChangeEmail({
          to: updated.email,
          name: updated.name,
          oldRole,
          newRole: updated.role,
          isPromotion
        });
      } catch (roleMailErr) {
        console.error('Failed to dispatch role change email:', roleMailErr);
      }

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'Super Admin',
        action: isPromotion ? 'Staff Role Promoted' : isDemotion ? 'Staff Role Demoted' : 'Role Updated',
        type: 'Auth',
        status: 'Successful',
        details: `${req.user.name || 'Super Admin'} ${isPromotion ? 'promoted' : isDemotion ? 'demoted' : 'updated'} ${updated.name} from "${oldRole}" to "${updated.role}"`
      });

      res.json({
        success: true,
        message: `Successfully ${isPromotion ? 'promoted' : isDemotion ? 'demoted' : 'updated'} ${updated.name} to ${updated.role}.`,
        staff: updated
      });
    } catch (error) {
      console.error('Error updating staff role:', error);
      res.status(500).json({ message: 'Error updating staff role' });
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

      // Department boundary enforcement: Department Admins can only manage staff within their own department
      const requesterRole = (req.user?.role || '').toLowerCase();
      const requesterDept = (req.user?.department || '').toLowerCase();
      const targetDept = (staff.department || '').toLowerCase();
      const isITOrSuper = requesterRole === 'super admin' || requesterRole.includes('it admin') || requesterRole.includes('it administrator');
      if (!isITOrSuper) {
        if (requesterDept && targetDept && requesterDept !== targetDept) {
          return res.status(403).json({
            message: `Department Boundary Violation: As a ${req.user.role}, you can only manage staff members within the ${req.user.department} department.`
          });
        }
      }

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
