const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'cafe-admin-secret-key';

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Hash password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Compare password
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Create default admin user
const createDefaultAdmin = async () => {
  try {
    const existingAdmin = await db.pool.query('SELECT id FROM admin_users LIMIT 1');
    
    if (existingAdmin.rows.length === 0) {
      const defaultPassword = 'admin123';
      const hashedPassword = await hashPassword(defaultPassword);
      
      await db.pool.query(
        'INSERT INTO admin_users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        ['admin', 'admin@cafe-international.de', hashedPassword, 'super_admin']
      );
      
      console.log('✅ Default admin user created:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   ⚠️  Please change the password after first login!');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  createDefaultAdmin
};