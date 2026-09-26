const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', decoded);

    // Dynamic database name resolution fallback to prevent cached "User" names
    if (!decoded.name || decoded.name === 'User') {
      try {
        const Student = require('../models/Users/Student');
        const Alumni = require('../models/Users/Alumni');
        const Registrar = require('../models/Registrar');
        const SuperAdmin = require('../models/Users/SuperAdmin');

        let dbUser = await Student.findById(decoded.id);
        if (dbUser) {
          decoded.name = `${dbUser.firstName || ''} ${dbUser.lastName || ''}`.trim();
        } else {
          dbUser = await Alumni.findById(decoded.id);
          if (dbUser) {
            decoded.name = `${dbUser.firstName || ''} ${dbUser.lastName || ''}`.trim();
          } else {
            dbUser = await Registrar.findById(decoded.id) || await SuperAdmin.findById(decoded.id);
            if (dbUser) {
              decoded.name = dbUser.name;
              decoded.role = dbUser.role || decoded.role;
              decoded.department = dbUser.department || (dbUser.role === 'Super Admin' ? 'Administration' : '');
            }
          }
        }
      } catch (dbErr) {
        console.error('Failed to resolve dynamic name in auth middleware:', dbErr);
      }
    }

    if (!decoded.department && decoded.id) {
      try {
        const Registrar = require('../models/Registrar');
        const SuperAdmin = require('../models/Users/SuperAdmin');
        const dbUser = await Registrar.findById(decoded.id) || await SuperAdmin.findById(decoded.id);
        if (dbUser) {
          decoded.role = dbUser.role || decoded.role;
          decoded.department = dbUser.department || (dbUser.role === 'Super Admin' ? 'Administration' : '');
        }
      } catch (_e) {}
    }

    if (!decoded.name) {
      decoded.name = 'User';
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const superAdminOnly = (req, res, next) => {
  console.log('Checking super admin access. User role:', req.user?.role);
  if (req.user && (req.user.role === 'super admin' || (req.user.role || '').toLowerCase() === 'super admin')) {
    console.log('Super admin access granted');
    next();
  } else {
    console.log('Super admin access denied');
    res.status(403).json({ message: 'Not authorized as Super Admin' });
  }
};

const registrarOrSuperAdmin = (req, res, next) => {
  const role = (req.user?.role || '').toLowerCase();
  if (req.user && ['registrar', 'registrar staff', 'registrar admin', 'admin', 'staff', 'super admin'].includes(role)) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized, role insufficient' });
  }
};

// Restricted to Accounting Staff, Accounting Admin, and Super Admin
const accountingOnly = (req, res, next) => {
  const role = (req.user?.role || '').toLowerCase();
  const department = (req.user?.department || '').toLowerCase();
  if (req.user && (
    ['accounting admin', 'accounting staff', 'super admin'].includes(role) ||
    (department === 'accounting' && ['admin', 'staff'].some(r => role.includes(r)))
  )) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized. Payment and refund verification is restricted to Accounting personnel.' });
  }
};

// Restricted to Registrar Staff, Registrar Admin, and Super Admin
const registrarOnly = (req, res, next) => {
  const role = (req.user?.role || '').toLowerCase();
  const department = (req.user?.department || '').toLowerCase();
  if (req.user && (
    ['registrar admin', 'registrar staff', 'registrar', 'super admin'].includes(role) ||
    department === 'registrar'
  )) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized. Restricted to Registrar personnel.' });
  }
};

// Restricted to IT Administrator and Super Admin
const itOrSuperAdmin = (req, res, next) => {
  const role = (req.user?.role || '').toLowerCase();
  if (req.user && ['it administrator', 'it admin', 'super admin'].includes(role)) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized. Restricted to IT Administrators.' });
  }
};

// Staff management (Super Admin, IT Admin, Registrar Admin, Accounting Admin)
const canManageStaff = (req, res, next) => {
  const role = (req.user?.role || '').toLowerCase();
  const department = (req.user?.department || '').toLowerCase();
  if (
    role === 'super admin' ||
    ['it administrator', 'it admin'].includes(role) ||
    role === 'registrar admin' ||
    role === 'accounting admin' ||
    (department === 'it administration' && role.includes('admin'))
  ) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized to manage staff accounts.' });
  }
};

// User management (Students, Alumni) - Super Admin and IT Administrator
const canManageUsers = (req, res, next) => {
  const role = (req.user?.role || '').toLowerCase();
  if (
    role === 'super admin' ||
    ['it administrator', 'it admin'].includes(role)
  ) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized to manage user accounts.' });
  }
};

// View system / activity logs
const canViewLogs = (req, res, next) => {
  const role = (req.user?.role || '').toLowerCase();
  if (
    role === 'super admin' ||
    ['it administrator', 'it admin'].includes(role) ||
    role === 'registrar admin' ||
    role === 'accounting admin'
  ) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized to view system logs.' });
  }
};

module.exports = {
  auth,
  protect: auth,
  superAdminOnly,
  registrarOrSuperAdmin,
  accountingOnly,
  registrarOnly,
  itOrSuperAdmin,
  canManageStaff,
  canManageUsers,
  canViewLogs
};
