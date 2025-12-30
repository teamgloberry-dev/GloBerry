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
    console.error('Partner error:', error);
    res.status(500).json({ error: 'Failed to process partner application', details: error.message });
  }
}