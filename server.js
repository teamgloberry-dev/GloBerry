const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./config/database');
const { createDefaultAdmin } = require('./middleware/auth');
const adminRoutes = require('./routes/admin');
const setupRoutes = require('./routes/setup');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware disabled for development

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// API Routes for form submissions
app.post('/api/booking', async (req, res) => {
  try {
    console.log('Booking request received:', req.body);
    const { name, email, phone, package, requirements } = req.body;
    
    // Validate required fields
    if (!name || !email || !package) {
      return res.status(400).json({ error: 'Missing required fields: name, email, package' });
    }
    
    // Save to database
    const result = await db.pool.query(
      'INSERT INTO bookings (name, email, phone, package, requirements) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, phone, package, requirements]
    );
    
    console.log('New booking saved:', result.rows[0]);
    
    res.json({ success: true, message: 'Booking received successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('Booking form error:', error);
    res.status(500).json({ error: 'Failed to process booking', details: error.message });
  }
});

app.post('/api/partner', async (req, res) => {
  try {
    console.log('Partner request received:', req.body);
    const { name, email, type, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !type) {
      return res.status(400).json({ error: 'Missing required fields: name, email, type' });
    }
    
    // Save to database
    const result = await db.pool.query(
      'INSERT INTO partners (name, email, type, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, type, message]
    );
    
    console.log('New partner application saved:', result.rows[0]);
    
    res.json({ success: true, message: 'Partner application received', id: result.rows[0].id });
  } catch (error) {
    console.error('Partner form error:', error);
    res.status(500).json({ error: 'Failed to process partner application', details: error.message });
  }
});

app.post('/api/contact', async (req, res) => {
  try {
    console.log('Contact request received:', req.body);
    const { name, email, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields: name, email, message' });
    }
    
    // Save to database
    const result = await db.pool.query(
      'INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3) RETURNING *',
      [name, email, message]
    );
    
    console.log('New contact message saved:', result.rows[0]);
    
    res.json({ success: true, message: 'Message sent successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await db.pool.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString(),
      version: require('./package.json').version
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Database test endpoints
app.get('/api/test/bookings', async (req, res) => {
  try {
    const result = await db.pool.query('SELECT COUNT(*) FROM bookings');
    res.json({ table: 'bookings', count: result.rows[0].count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/test/partners', async (req, res) => {
  try {
    const result = await db.pool.query('SELECT COUNT(*) FROM partners');
    res.json({ table: 'partners', count: result.rows[0].count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/test/contacts', async (req, res) => {
  try {
    const result = await db.pool.query('SELECT COUNT(*) FROM contacts');
    res.json({ table: 'contacts', count: result.rows[0].count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// View all entries
app.get('/api/admin/bookings', async (req, res) => {
  try {
    const result = await db.pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/partners', async (req, res) => {
  try {
    const result = await db.pool.query('SELECT * FROM partners ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/contacts', async (req, res) => {
  try {
    const result = await db.pool.query('SELECT * FROM contacts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Database initialization endpoint
app.get('/api/init-db', async (req, res) => {
  try {
    await db.initialize();
    await createDefaultAdmin();
    res.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Database init error:', error);
    res.status(500).json({ error: 'Database initialization failed', details: error.message });
  }
});

// Test form submission
app.get('/api/test-form', async (req, res) => {
  try {
    const testBooking = await db.pool.query(
      'INSERT INTO bookings (name, email, phone, package, requirements) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      ['Test User', 'test@example.com', '123456789', 'starter', 'Test booking']
    );
    
    const bookings = await db.pool.query('SELECT * FROM bookings ORDER BY created_at DESC LIMIT 5');
    
    res.json({ 
      success: true, 
      testBooking: testBooking.rows[0],
      recentBookings: bookings.rows
    });
  } catch (error) {
    console.error('Test form error:', error);
    res.status(500).json({ error: 'Test failed', details: error.message });
  }
});

// Setup routes (for initial deployment)
app.use('/api/setup', setupRoutes);

// Debug endpoint
app.get('/api/debug/token', (req, res) => {
  const authHeader = req.headers.authorization;
  res.json({ 
    hasAuth: !!authHeader,
    authHeader: authHeader ? authHeader.substring(0, 20) + '...' : 'none',
    timestamp: new Date().toISOString()
  });
});

// Debug auth middleware
app.get('/api/debug/auth', require('./middleware/auth').verifyToken, (req, res) => {
  res.json({ 
    success: true,
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Debug booking update
app.put('/api/debug/booking/:id', require('./middleware/auth').verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('Debug booking update:', { id, status });
    
    const result = await db.pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    res.json({ success: true, result: result.rows[0] });
  } catch (error) {
    console.error('Debug booking error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Admin routes
app.use('/api/admin', adminRoutes);

// Admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start server with database
async function startServer() {
  try {
    await db.initialize();
    await createDefaultAdmin();
    app.listen(PORT, () => {
      console.log(`🚀 CAFÉ International server running on port ${PORT}`);
      console.log(`📱 Visit: http://localhost:${PORT}`);
      console.log(`🔧 Admin Portal: http://localhost:${PORT}/admin`);
      console.log(`☕ From Airport to Apartment - Supporting Students in Berlin`);
      console.log(`❤️  Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();