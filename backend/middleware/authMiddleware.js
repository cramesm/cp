const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretverifitor123');
    console.log('Token decoded:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const systemAdminOnly = (req, res, next) => {
  console.log('Checking system admin access. User role:', req.user?.role);
  if (req.user && req.user.role === 'system admin') {
    console.log('System admin access granted');
    next();
  } else {
    console.log('System admin access denied');
    res.status(403).json({ message: 'Not authorized as System Admin' });
  }
};

const adminOrSystemAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'system admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized, role insufficient' });
  }
};

module.exports = { protect, systemAdminOnly, adminOrSystemAdmin };
