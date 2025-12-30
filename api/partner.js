const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, type, message } = req.body;
    
    const result = await pool.query(
      'INSERT INTO partners (name, email, type, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, type, message]
    );
    
    res.json({ success: true, message: 'Partner application received', id: result.rows[0].id });
  } catch (error) {
    console.error('Partner error:', error);
    res.status(500).json({ error: 'Failed to process partner application' });
  }
}