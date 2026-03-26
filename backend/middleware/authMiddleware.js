const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretverifitor123');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const systemAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'system admin') {
    next();
  } else {
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
