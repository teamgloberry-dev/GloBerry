const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = async function handler(req, res) {
  try {
    const bookingsCount = await pool.query('SELECT COUNT(*) FROM bookings');
    const contactsCount = await pool.query('SELECT COUNT(*) FROM contacts');
    const partnersCount = await pool.query('SELECT COUNT(*) FROM partners');
    
    res.json({
      bookings: [{ status: 'pending', total: bookingsCount.rows[0].count }],
      contacts: [{ status: 'new', total: contactsCount.rows[0].count }],
      partners: [{ status: 'pending', total: partnersCount.rows[0].count }],
      recentBookings: bookingsCount.rows[0].count,
      recentContacts: contactsCount.rows[0].count
    });
  } catch (error) {
    res.json({
      bookings: [{ status: 'pending', total: 0 }],
      contacts: [{ status: 'new', total: 0 }],
      partners: [{ status: 'pending', total: 0 }],
      recentBookings: 0,
      recentContacts: 0
    });
  }
}