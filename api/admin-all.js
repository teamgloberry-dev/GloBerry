const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = async function handler(req, res) {
  const { action } = req.query;

  // Login
  if (action === 'login' && req.method === 'POST') {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
      return res.json({ success: true, token: 'demo-token', user: { username: 'admin' }});
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Dashboard
  if (action === 'dashboard') {
    try {
      const bookingsCount = await pool.query('SELECT COUNT(*) FROM bookings');
      const contactsCount = await pool.query('SELECT COUNT(*) FROM contacts');
      const partnersCount = await pool.query('SELECT COUNT(*) FROM partners');
      
      return res.json({
        bookings: [{ status: 'pending', total: bookingsCount.rows[0].count }],
        contacts: [{ status: 'new', total: contactsCount.rows[0].count }],
        partners: [{ status: 'pending', total: partnersCount.rows[0].count }],
        recentBookings: bookingsCount.rows[0].count,
        recentContacts: contactsCount.rows[0].count
      });
    } catch (error) {
      return res.json({ bookings: [], contacts: [], partners: [], recentBookings: 0, recentContacts: 0 });
    }
  }

  // Get data
  if (req.method === 'GET') {
    try {
      let result;
      if (action === 'bookings') {
        result = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
      } else if (action === 'contacts') {
        result = await pool.query('SELECT * FROM contacts ORDER BY created_at DESC');
      } else if (action === 'partners') {
        result = await pool.query('SELECT * FROM partners ORDER BY created_at DESC');
      }
      return res.json(result?.rows || []);
    } catch (error) {
      return res.json([]);
    }
  }

  // Update booking status
  if (req.method === 'PUT' && action === 'booking') {
    try {
      const { id, status } = req.body;
      const result = await pool.query(
        'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
      );
      return res.json({ success: true, result: result.rows[0] });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  res.status(404).json({ error: 'Not found' });
}