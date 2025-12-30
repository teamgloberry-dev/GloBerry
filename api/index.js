const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// Database connection with multiple env var options
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple admin auth
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    res.json({ 
      success: true, 
      token: 'demo-token', 
      user: { username: 'admin' }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Admin dashboard data
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const bookingsCount = await pool.query('SELECT COUNT(*) FROM bookings');
    const contactsCount = await pool.query('SELECT COUNT(*) FROM contacts');
    const partnersCount = await pool.query('SELECT COUNT(*) FROM partners');
    
    res.json({
      bookings: [{ status: 'pending', total: bookingsCount.rows[0].count }],
      contacts: [{ status: 'new', total: contactsCount.rows[0].count }],
      partners: [{ status: 'pending', total: partnersCount.rows[0].count }],
      recentBookings: bookingsCount.rows[0].count,
      recentContacts: contactsCount.rows[0].count
    });
  } catch (error) {
    res.json({
      bookings: [{ status: 'pending', total: 0 }],
      contacts: [{ status: 'new', total: 0 }],
      partners: [{ status: 'pending', total: 0 }],
      recentBookings: 0,
      recentContacts: 0
    });
  }
});

// Admin routes
app.get('/api/admin/bookings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.json([]);
  }
});

app.get('/api/admin/contacts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contacts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.json([]);
  }
});

app.get('/api/admin/partners', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM partners ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.json([]);
  }
});

// API Routes
// API Routes for form submissions
app.post('/api/booking', async (req, res) => {
  try {
    const { name, email, phone, package, requirements } = req.body;
    
    if (!name || !email || !package) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await pool.query(
      'INSERT INTO bookings (name, email, phone, package, requirements) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, phone, package, requirements]
    );
    
    res.json({ success: true, message: 'Booking received successfully', id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process booking' });
  }
});

app.post('/api/partner', async (req, res) => {
  try {
    const { name, email, type, message } = req.body;
    
    if (!name || !email || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await pool.query(
      'INSERT INTO partners (name, email, type, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, type, message]
    );
    
    res.json({ success: true, message: 'Partner application received', id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process partner application' });
  }
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await pool.query(
      'INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3) RETURNING *',
      [name, email, message]
    );
    
    res.json({ success: true, message: 'Message sent successfully', id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'admin.html'));
});

// Debug endpoint
app.get('/api/debug/db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      success: true, 
      time: result.rows[0].now,
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        hasPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
        hasNonPooling: !!process.env.POSTGRES_URL_NON_POOLING,
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        hasPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
        hasNonPooling: !!process.env.POSTGRES_URL_NON_POOLING,
        nodeEnv: process.env.NODE_ENV
      }
    });
  }
});

// Database initialization endpoint
app.get('/api/init-db', async (req, res) => {
  try {
    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        package VARCHAR(100) NOT NULL,
        requirements TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS partners (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        message TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    res.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = app;