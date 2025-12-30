const express = require('express');
const { verifyToken, generateToken, comparePassword } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const result = await db.pool.query(
      'SELECT * FROM admin_users WHERE username = $1 AND is_active = true',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const isValidPassword = await comparePassword(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    await db.pool.query(
      'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    
    const token = generateToken(user);
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Dashboard stats
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const stats = await Promise.all([
      db.pool.query('SELECT COUNT(*) as total, status FROM bookings GROUP BY status'),
      db.pool.query('SELECT COUNT(*) as total, status FROM partners GROUP BY status'),
      db.pool.query('SELECT COUNT(*) as total, status FROM contacts GROUP BY status'),
      db.pool.query('SELECT COUNT(*) as total FROM bookings WHERE created_at >= CURRENT_DATE - INTERVAL \'7 days\''),
      db.pool.query('SELECT COUNT(*) as total FROM contacts WHERE created_at >= CURRENT_DATE - INTERVAL \'7 days\'')
    ]);
    
    res.json({
      bookings: stats[0].rows,
      partners: stats[1].rows,
      contacts: stats[2].rows,
      recentBookings: stats[3].rows[0].total,
      recentContacts: stats[4].rows[0].total
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// Bookings management
router.get('/bookings', verifyToken, async (req, res) => {
  try {
    const { status, package: packageType } = req.query;
    let query = 'SELECT * FROM bookings';
    let params = [];
    let conditions = [];
    
    if (status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }
    
    if (packageType) {
      conditions.push(`package = $${params.length + 1}`);
      params.push(packageType);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await db.pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Bookings fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

router.put('/bookings/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    
    console.log('Updating booking:', { id, status, admin_notes });
    
    // Build dynamic query based on what fields are provided
    let updateFields = [];
    let values = [];
    let paramCount = 1;
    
    if (status !== undefined) {
      updateFields.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }
    
    if (admin_notes !== undefined) {
      updateFields.push(`admin_notes = $${paramCount}`);
      values.push(admin_notes);
      paramCount++;
    }
    
    values.push(id);
    
    const query = `UPDATE bookings SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    console.log('Executing query:', query, values);
    
    const result = await db.pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    console.log('Booking updated:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Booking update error:', error);
    res.status(500).json({ error: 'Failed to update booking', details: error.message });
  }
});

// Contacts management
router.get('/contacts', verifyToken, async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM contacts';
    let params = [];
    
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await db.pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Contacts fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

router.put('/contacts/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    
    console.log('Updating contact:', { id, status, admin_notes });
    
    // Build dynamic query based on what fields are provided
    let updateFields = [];
    let values = [];
    let paramCount = 1;
    
    if (status !== undefined) {
      updateFields.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }
    
    if (admin_notes !== undefined) {
      updateFields.push(`admin_notes = $${paramCount}`);
      values.push(admin_notes);
      paramCount++;
    }
    
    values.push(id);
    
    const query = `UPDATE contacts SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    console.log('Executing query:', query, values);
    
    const result = await db.pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    console.log('Contact updated:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Contact update error:', error);
    res.status(500).json({ error: 'Failed to update contact', details: error.message });
  }
});

// Partners management
router.get('/partners', verifyToken, async (req, res) => {
  try {
    const { status, type } = req.query;
    let query = 'SELECT * FROM partners';
    let params = [];
    let conditions = [];
    
    if (status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }
    
    if (type) {
      conditions.push(`type = $${params.length + 1}`);
      params.push(type);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await db.pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Partners fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch partners' });
  }
});

router.put('/partners/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    
    console.log('Updating partner:', { id, status, admin_notes });
    
    // Build dynamic query based on what fields are provided
    let updateFields = [];
    let values = [];
    let paramCount = 1;
    
    if (status !== undefined) {
      updateFields.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }
    
    if (admin_notes !== undefined) {
      updateFields.push(`admin_notes = $${paramCount}`);
      values.push(admin_notes);
      paramCount++;
    }
    
    values.push(id);
    
    const query = `UPDATE partners SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    console.log('Executing query:', query, values);
    
    const result = await db.pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    
    console.log('Partner updated:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Partner update error:', error);
    res.status(500).json({ error: 'Failed to update partner', details: error.message });
  }
});

module.exports = router;