const { Pool } = require('pg');

// Database configuration for both local and production
const getDatabaseConfig = () => {
  if (process.env.DATABASE_URL) {
    // Production (Vercel) - use DATABASE_URL
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    };
  } else {
    // Local development - use individual variables
    return {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'cafe_international',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: false
    };
  }
};

const pool = new Pool(getDatabaseConfig());

const createTables = async () => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      package VARCHAR(20) NOT NULL CHECK (package IN ('free', 'starter', 'essentials', 'premium')),
      requirements TEXT,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
      admin_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS partners (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      type VARCHAR(20) NOT NULL CHECK (type IN ('volunteer', 'mentor', 'partner', 'investor')),
      message TEXT,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      admin_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved')),
      admin_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP
    )`
  ];

  for (const query of queries) {
    await pool.query(query);
  }
};

const initialize = async () => {
  try {
    await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    await createTables();
    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

module.exports = { pool, initialize };