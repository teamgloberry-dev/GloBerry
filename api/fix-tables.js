const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async function handler(req, res) {
  try {
    // Drop and recreate tables without constraints
    const queries = [
      `DROP TABLE IF EXISTS bookings CASCADE`,
      `DROP TABLE IF EXISTS partners CASCADE`, 
      `DROP TABLE IF EXISTS contacts CASCADE`,
      
      `CREATE TABLE bookings (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        package VARCHAR(20) NOT NULL,
        requirements TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE partners (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL,
        message TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const query of queries) {
      await pool.query(query);
    }
    
    res.json({ success: true, message: 'Database tables recreated without constraints' });
  } catch (error) {
    console.error('Fix tables error:', error);
    res.status(500).json({ error: error.message });
  }
}