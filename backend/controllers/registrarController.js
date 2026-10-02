const Registrar = require('../models/Registrar');
const Admin = require('../models/Users/Admin');
const ActivityLog = require('../models/ActivityLog');
const { sendStaffWelcomeEmail, sendAccountStatusEmail, sendRoleChangeEmail } = require('../utils/emailService');

const escapeRegex = (string) => {
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const RegistrarController = {
  // @desc    Get all registrars and admins
  // @desc    Get all registrars and admins (Scoped by department for Dept Admins, global with filters for Super Admin)
  getAllRegistrars: async (req, res) => {
    try {
      const userRole = (req.user?.role || '').toLowerCase();
      const userDept = (req.user?.department || '').toLowerCase();

      let query = {
        isArchived: { $ne: true },
        status: { $ne: 'Archived' }
      };

      // Department Scoping:
      // Super Admin: Global access (can optionally filter by req.query.department)
      // Registrar Admin: strictly scoped to Registrar department
      // Accounting Admin: strictly scoped to Accounting department
      // IT Admin: strictly scoped to IT Administration department
      if (userRole !== 'super admin') {
        if (userRole.includes('registrar') || userDept === 'registrar') {
          query.department = { $regex: /^registrar/i };
          query.role = { $not: { $regex: /(accounting|it)/i } };
        } else if (userRole.includes('accounting') || userDept === 'accounting') {
          query.department = { $regex: /^accounting/i };
          query.role = { $not: { $regex: /(registrar|it)/i } };
        } else if (userRole.includes('it') || userDept.includes('it')) {
          query.department = { $regex: /^it/i };
          query.role = { $not: { $regex: /(registrar|accounting)/i } };
        }
      } else {
        if (req.query.department && req.query.department !== 'All' && req.query.department !== 'All Departments') {
          query.department = { $regex: new RegExp(`^${escapeRegex(req.query.department)}`, 'i') };
        }
      }

      if (req.query.role && req.query.role !== 'All' && req.query.role !== 'All Roles') {
        if (req.query.role.toLowerCase() === 'admins') {
          query.role = { $regex: /admin/i };
        } else if (req.query.role.toLowerCase() === 'staff') {
          query.role = { $regex: /staff/i };
        } else {
          query.role = { $regex: new RegExp(escapeRegex(req.query.role), 'i') };
        }
      }

      if (req.query.status && req.query.status !== 'All' && req.query.status !== 'All Status') {
        query.status = req.query.status;
      }

      const registrars = await Registrar.find(query);

      let admins = [];
      // Only include Admin model accounts if Super Admin
      if (userRole === 'super admin' && (!req.query.department || req.query.department === 'All' || req.query.department === 'All Departments')) {
        let adminQuery = {
          isArchived: { $ne: true },
          status: { $ne: 'Archived' }
        };
        if (req.query.status && req.query.status !== 'All' && req.query.status !== 'All Status') {
          adminQuery.status = req.query.status;
        }
        admins = await Admin.find(adminQuery);
      }

      const combined = [
        ...registrars.map(r => {
          const obj = r.toObject ? r.toObject() : { ...r };
          const roleLower = (obj.role || '').toLowerCase();
          if (roleLower.includes('accounting')) {
            obj.department = 'Accounting';
          } else if (roleLower.includes('it')) {
            obj.department = 'IT Administration';
          } else if (roleLower.includes('registrar') || !obj.department) {
            obj.department = 'Registrar';
          }
          return obj;
        }),
        ...admins.map(a => ({
          ...(a.toObject ? a.toObject() : a),
          registrarId: 'ADMIN-' + a._id.toString().substring(0, 4),
          status: a.status || 'Active',
          department: a.department || 'Administration'
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
      const userRole = (req.user?.role || '').toLowerCase();
      const userDept = (req.user?.department || '').toLowerCase();

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

      // Department boundary enforcement for single staff lookup
      if (userRole !== 'super admin') {
        const staffDept = (staff.department || '').toLowerCase();
        let targetPrefix = '';
        if (userRole.includes('registrar') || userDept === 'registrar') targetPrefix = 'registrar';
        else if (userRole.includes('accounting') || userDept === 'accounting') targetPrefix = 'accounting';
        else if (userRole.includes('it') || userDept.includes('it')) targetPrefix = 'it';

        if (targetPrefix && !staffDept.startsWith(targetPrefix)) {
          return res.status(403).json({ message: `Access denied: You can only view staff within your department (${req.user.department || userRole}).` });
        }
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

  // @desc    Create new registrar/staff (Super Admin, IT Admin, or Department Admin)
  createRegistrar: async (req, res) => {
    try {
      let { name, firstName, lastName, email, password, role, department } = req.body;

      if (!name && (firstName || lastName)) {
        name = `${(firstName || '').trim()} ${(lastName || '').trim()}`.trim();
      }

      if (!name || !email) {
        return res.status(400).json({ message: 'First name, last name, and email are required.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({ message: 'Please provide a valid email address.' });
      }

      // Check across all user collections to prevent duplicate email collisions
      const Student = require('../models/Users/Student');
      const Alumni = require('../models/Users/Alumni');
      const SuperAdmin = require('../models/Users/SuperAdmin');
      const emailQuery = { email: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };

      const [existingReg, existingAdmin, existingStudent, existingAlumni, existingSuper] = await Promise.all([
        Registrar.findOne(emailQuery),
        Admin.findOne(emailQuery),
        Student.findOne(emailQuery),
        Alumni.findOne(emailQuery),
        SuperAdmin.findOne(emailQuery)
      ]);

      if (existingReg || existingAdmin || existingStudent || existingAlumni || existingSuper) {
        return res.status(400).json({ message: 'An account with this email address already exists.' });
      }

      const requesterRole = (req.user?.role || '').toLowerCase();
      const requesterDept = (req.user?.department || '').toLowerCase();
      const isITOrSuper = requesterRole === 'super admin' || requesterRole.includes('it admin') || requesterRole.includes('it administrator');

      // Department scoping:
      // Department admins (Registrar Admin, Accounting Admin) are restricted to their own department
      let assignedDept = department;
      if (!isITOrSuper) {
        if (requesterRole.includes('registrar') || requesterDept === 'registrar') {
          assignedDept = 'Registrar';
        } else if (requesterRole.includes('accounting') || requesterDept === 'accounting') {
          assignedDept = 'Accounting';
        }
      }
      if (!assignedDept) {
        assignedDept = 'Registrar';
      }

      // Default role to operational staff in that department
      let assignedRole = role || (
        assignedDept.toLowerCase().includes('accounting') ? 'Accounting Staff' :
        assignedDept.toLowerCase().includes('it') ? 'IT Staff' : 'Registrar Staff'
      );

      // Only Super Admin can appoint Admin roles
      if (assignedRole.toLowerCase().includes('admin') && requesterRole !== 'super admin') {
        assignedRole = assignedDept.toLowerCase().includes('accounting') ? 'Accounting Staff' :
                       assignedDept.toLowerCase().includes('it') ? 'IT Staff' : 'Registrar Staff';
      }

      // Generate secure temporary password if not provided
      let finalPassword = password;
      if (!finalPassword || typeof finalPassword !== 'string' || !finalPassword.trim()) {
        const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        const lowers = "abcdefghijkmnopqrstuvwxyz";
        const digits = "23456789";
        const specials = "!@#$*";
        let temp = "";
        temp += uppers.charAt(Math.floor(Math.random() * uppers.length));
        temp += lowers.charAt(Math.floor(Math.random() * lowers.length));
        temp += lowers.charAt(Math.floor(Math.random() * lowers.length));
        temp += digits.charAt(Math.floor(Math.random() * digits.length));
        temp += digits.charAt(Math.floor(Math.random() * digits.length));
        temp += specials.charAt(Math.floor(Math.random() * specials.length));
        const pool = uppers + lowers + digits;
        for (let i = 0; i < 3; i++) {
          temp += pool.charAt(Math.floor(Math.random() * pool.length));
        }
        finalPassword = temp.split('').sort(() => 0.5 - Math.random()).join('');
      }

      const deptPrefix = assignedDept.substring(0, 3).toUpperCase();
      const registrarId = `${deptPrefix}-${Math.floor(100000 + Math.random() * 900000)}`;

      const newRegistrar = await Registrar.create({
        registrarId,
        name,
        email: cleanEmail,
        password: finalPassword,
        role: assignedRole,
        department: assignedDept,
        status: 'Active',
        mustChangePassword: true
      });

      // Send welcome email with credentials & department info
      try {
        await sendStaffWelcomeEmail({
          to: cleanEmail,
          name,
          email: cleanEmail,
          tempPassword: finalPassword,
          department: assignedDept,
          role: newRegistrar.role
        });
      } catch (emailErr) {
        console.error('Failed to send staff welcome email:', emailErr);
      }

      await ActivityLog.create({
        userEmail: req.user?.email || 'admin@verifitor.edu',
        userName: req.user?.name || 'Administrator',
        action: 'Staff Account Created',
        type: 'Staff Management',
        status: 'Successful',
        details: `Created new staff account for ${name} (${cleanEmail}) - Role: ${newRegistrar.role}, Dept: ${assignedDept}`
      });

      res.status(201).json({
        success: true,
        message: 'Staff account created successfully! Credentials and login instructions have been dispatched via email.',
        tempPassword: finalPassword,
        registrar: {
          _id: newRegistrar._id,
          registrarId: newRegistrar.registrarId,
          name: newRegistrar.name,
          email: newRegistrar.email,
          role: newRegistrar.role,
          department: newRegistrar.department,
          status: newRegistrar.status,
          mustChangePassword: newRegistrar.mustChangePassword
        }
      });
    } catch (error) {
      console.error('Error creating staff:', error);
      res.status(500).json({ message: 'Error creating staff account' });
    }
  },

  // @desc    Update registrar/admin
  updateRegistrar: async (req, res) => {
    try {
      // Staff Employee ID is immutable and cannot be changed
      delete req.body.registrarId;
      delete req.body.employeeId;
      delete req.body.password;

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
      if (role) {
        updateData.role = role;
        const roleLower = role.toLowerCase();
        if (roleLower.includes('accounting')) {
          updateData.department = 'Accounting';
        } else if (roleLower.includes('it')) {
          updateData.department = 'IT Administration';
        } else if (roleLower.includes('registrar')) {
          updateData.department = 'Registrar';
        }
      }
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

      let updateData = { role };
      const roleLower = (role || '').toLowerCase();
      if (roleLower.includes('accounting')) {
        updateData.department = 'Accounting';
      } else if (roleLower.includes('it')) {
        updateData.department = 'IT Administration';
      } else if (roleLower.includes('registrar')) {
        updateData.department = 'Registrar';
      }

      const updated = await model.findByIdAndUpdate(req.params.id, updateData, { new: true });

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
