const express = require('express');
const { hashPassword } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Setup admin user (one-time use)
router.get('/create-admin', async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await db.pool.query('SELECT id FROM admin_users LIMIT 1');
    
    if (existingAdmin.rows.length > 0) {
      return res.json({ message: 'Admin user already exists' });
    }
    
    // Create admin user
    const defaultPassword = 'admin123';
    const hashedPassword = await hashPassword(defaultPassword);
    
    await db.pool.query(
      'INSERT INTO admin_users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      ['admin', 'admin@cafe-international.de', hashedPassword, 'super_admin']
    );
    
    res.json({ 
      success: true, 
      message: 'Admin user created successfully',
      credentials: {
        username: 'admin',
        password: 'admin123'
      }
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: 'Setup failed', details: error.message });
  }
});

// Debug admin user
router.get('/check-admin', async (req, res) => {
  try {
    const admin = await db.pool.query('SELECT id, username, email, role, is_active FROM admin_users WHERE username = $1', ['admin']);
    
    if (admin.rows.length === 0) {
      return res.json({ message: 'No admin user found' });
    }
    
    res.json({ 
      message: 'Admin user found',
      user: admin.rows[0]
    });
  } catch (error) {
    console.error('Check admin error:', error);
    res.status(500).json({ error: 'Check failed', details: error.message });
  }
});

// Reset admin password
router.get('/reset-admin', async (req, res) => {
  try {
    const defaultPassword = 'admin123';
    const hashedPassword = await hashPassword(defaultPassword);
    
    const result = await db.pool.query(
      'UPDATE admin_users SET password_hash = $1 WHERE username = $2 RETURNING id, username',
      [hashedPassword, 'admin']
    );
    
    if (result.rows.length === 0) {
      return res.json({ message: 'Admin user not found' });
    }
    
    res.json({ 
      success: true,
      message: 'Admin password reset successfully',
      credentials: {
        username: 'admin',
        password: 'admin123'
      }
    });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: 'Reset failed', details: error.message });
  }
});

// Test login
router.get('/test-login', async (req, res) => {
  try {
    const { comparePassword } = require('../middleware/auth');
    
    const result = await db.pool.query(
      'SELECT * FROM admin_users WHERE username = $1 AND is_active = true',
      ['admin']
    );
    
    if (result.rows.length === 0) {
      return res.json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    const isValidPassword = await comparePassword('admin123', user.password_hash);
    
    res.json({
      userFound: true,
      passwordValid: isValidPassword,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Test login error:', error);
    res.status(500).json({ error: 'Test failed', details: error.message });
  }
});

module.exports = router;