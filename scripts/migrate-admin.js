const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrateDatabase() {
  try {
    console.log('🔄 Starting database migration for admin features...');
    
    // Add admin_notes and updated_at columns to existing tables
    const migrations = [
      // Bookings table
      `ALTER TABLE bookings 
       ADD COLUMN IF NOT EXISTS admin_notes TEXT,
       ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      
      // Partners table  
      `ALTER TABLE partners 
       ADD COLUMN IF NOT EXISTS admin_notes TEXT,
       ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      
      // Contacts table
      `ALTER TABLE contacts 
       ADD COLUMN IF NOT EXISTS admin_notes TEXT,
       ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      
      // Update status constraints for bookings
      `ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check`,
      `ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
       CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'))`,
      
      // Update status constraints for partners
      `ALTER TABLE partners DROP CONSTRAINT IF EXISTS partners_status_check`,
      `ALTER TABLE partners ADD CONSTRAINT partners_status_check 
       CHECK (status IN ('pending', 'approved', 'rejected'))`,
      
      // Update status constraints for contacts
      `ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_status_check`,
      `ALTER TABLE contacts ADD CONSTRAINT contacts_status_check 
       CHECK (status IN ('new', 'read', 'resolved'))`
    ];
    
    for (const migration of migrations) {
      try {
        await pool.query(migration);
        console.log('✅ Migration executed successfully');
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('does not exist')) {
          console.log('⚠️  Migration skipped (already applied)');
        } else {
          console.error('❌ Migration failed:', error.message);
        }
      }
    }
    
    console.log('✅ Database migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrateDatabase();