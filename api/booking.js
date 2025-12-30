const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    console.error('Booking error:', error);
    res.status(500).json({ error: 'Failed to process booking', details: error.message });
  }
}