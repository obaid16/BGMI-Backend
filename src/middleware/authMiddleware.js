const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretbgmiesportssecretkey123!');

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized, token missing' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN' || req.user.role === 'REFEREE')) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied, administrator privileges required' });
  }
};

module.exports = {
  protect,
  adminOnly
};
