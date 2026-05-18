const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
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
        const Registrar = require('../models/Registrar');
        const SuperAdmin = require('../models/Users/SuperAdmin');

        let dbUser = await Student.findById(decoded.id);
        if (dbUser) {
          decoded.name = `${dbUser.firstName || ''} ${dbUser.lastName || ''}`.trim();
        } else {
          dbUser = await Registrar.findById(decoded.id) || await SuperAdmin.findById(decoded.id);
          if (dbUser) {
            decoded.name = dbUser.name;
          }
        }
      } catch (dbErr) {
        console.error('Failed to resolve dynamic name in auth middleware:', dbErr);
      }
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
  if (req.user && req.user.role === 'super admin') {
    console.log('Super admin access granted');
    next();
  } else {
    console.log('Super admin access denied');
    res.status(403).json({ message: 'Not authorized as Super Admin' });
  }
};

const registrarOrSuperAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'registrar' || req.user.role === 'super admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized, role insufficient' });
  }
};

module.exports = { protect, superAdminOnly, registrarOrSuperAdmin };
