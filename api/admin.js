const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const bookings = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
    const partners = await pool.query('SELECT * FROM partners ORDER BY created_at DESC');
    const contacts = await pool.query('SELECT * FROM contacts ORDER BY created_at DESC');
    
    res.json({
      bookings: bookings.rows,
      partners: partners.rows,
      contacts: contacts.rows,
      counts: {
        bookings: bookings.rows.length,
        partners: partners.rows.length,
        contacts: contacts.rows.length
      }
    });
  } catch (error) {
    console.error('Admin error:', error);
    res.status(500).json({ error: error.message });
  }
}