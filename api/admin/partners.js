const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = async function handler(req, res) {
  try {
    const result = await pool.query('SELECT * FROM partners ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.json([]);
  }
}