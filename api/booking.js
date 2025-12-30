const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  console.log('Booking API called with method:', req.method);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} not allowed. Expected POST.` });
  }

  try {
    const { name, email, phone, package, requirements } = req.body;
    
    console.log('Booking data received:', { name, email, phone, package, requirements });
    
    // Validate required fields
    if (!name || !email || !package) {
      return res.status(400).json({ error: 'Name, email, and package are required' });
    }
    
    // Validate package value
    const validPackages = ['free', 'starter', 'essentials', 'premium'];
    if (!validPackages.includes(package)) {
      return res.status(400).json({ error: `Invalid package. Must be one of: ${validPackages.join(', ')}` });
    }
    
    const result = await pool.query(
      'INSERT INTO bookings (name, email, phone, package, requirements) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, phone || null, package, requirements || null]
    );
    
    res.json({ success: true, message: 'Booking received successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: error.message || 'Failed to process booking' });
  }
}