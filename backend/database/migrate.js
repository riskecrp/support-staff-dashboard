require('dotenv').config({ path: '../.env' });
const db = require('./db');

async function migrate() {
  try {
    console.log('Starting database migration...');

    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'viewer')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Users table created');

    // Create staff_members table
    await db.query(`
      CREATE TABLE IF NOT EXISTS staff_members (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        is_senior BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        hire_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Staff members table created');

    // Create activity_logs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        staff_id INTEGER REFERENCES staff_members(id) ON DELETE CASCADE,
        log_date DATE NOT NULL,
        quizzes_accepted INTEGER DEFAULT 0,
        quizzes_rejected INTEGER DEFAULT 0,
        reports_completed INTEGER DEFAULT 0,
        total_forum_reports INTEGER DEFAULT 0,
        total_discord INTEGER DEFAULT 0,
        new_ig_reports INTEGER DEFAULT 0,
        new_forum_reports INTEGER DEFAULT 0,
        new_discord INTEGER DEFAULT 0,
        strike_given BOOLEAN DEFAULT FALSE,
        loa_days INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(staff_id, log_date)
      );
    `);
    console.log('✓ Activity logs table created');

    // Create strikes table
    await db.query(`
      CREATE TABLE IF NOT EXISTS strikes (
        id SERIAL PRIMARY KEY,
        staff_id INTEGER REFERENCES staff_members(id) ON DELETE CASCADE,
        issued_by INTEGER REFERENCES users(id),
        strike_date DATE NOT NULL,
        reason TEXT NOT NULL,
        severity VARCHAR(20) DEFAULT 'minor' CHECK (severity IN ('warning', 'minor', 'major', 'severe')),
        is_active BOOLEAN DEFAULT TRUE,
        removed_at TIMESTAMP,
        removed_by INTEGER REFERENCES users(id),
        removal_reason TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Strikes table created');

    // Create indexes for better performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_staff_date ON activity_logs(staff_id, log_date);
      CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_logs(log_date);
      CREATE INDEX IF NOT EXISTS idx_strikes_staff ON strikes(staff_id);
      CREATE INDEX IF NOT EXISTS idx_strikes_active ON strikes(is_active);
      CREATE INDEX IF NOT EXISTS idx_strikes_date ON strikes(strike_date);
    `);
    console.log('✓ Indexes created');

    // Create view for staff with strike counts
    await db.query(`
      CREATE OR REPLACE VIEW staff_with_strikes AS
      SELECT 
        sm.*,
        COUNT(CASE WHEN s.is_active = TRUE THEN 1 END) as active_strikes,
        COUNT(s.id) as total_strikes
      FROM staff_members sm
      LEFT JOIN strikes s ON sm.id = s.staff_id
      GROUP BY sm.id;
    `);
    console.log('✓ Views created');

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
