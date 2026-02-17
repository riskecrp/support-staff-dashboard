const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const schema = `
-- Staff table
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  is_support BOOLEAN DEFAULT true,
  is_senior_support BOOLEAN DEFAULT false,
  strikes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Monthly stats table
CREATE TABLE IF NOT EXISTS monthly_stats (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER REFERENCES staff(id),
  month_date DATE NOT NULL,
  in_game_reports INTEGER DEFAULT 0,
  forum_reports INTEGER DEFAULT 0,
  discord_activity INTEGER DEFAULT 0,
  quizzes_accepted INTEGER DEFAULT 0,
  quizzes_rejected INTEGER DEFAULT 0,
  other_activities INTEGER DEFAULT 0,
  loa_days INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(staff_id, month_date)
);

-- Strikes table
CREATE TABLE IF NOT EXISTS strikes (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER REFERENCES staff(id),
  issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reason TEXT,
  issued_by VARCHAR(255),
  is_removed BOOLEAN DEFAULT false,
  removed_date TIMESTAMP,
  removed_by VARCHAR(255)
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER REFERENCES staff(id),
  action VARCHAR(100) NOT NULL,
  details TEXT,
  old_value TEXT,
  new_value TEXT,
  performed_by VARCHAR(255),
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Name aliases table (for tracking name changes)
CREATE TABLE IF NOT EXISTS name_aliases (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER REFERENCES staff(id),
  old_name VARCHAR(255) NOT NULL,
  new_name VARCHAR(255) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_active ON staff(is_active);
CREATE INDEX IF NOT EXISTS idx_staff_support ON staff(is_support);
CREATE INDEX IF NOT EXISTS idx_monthly_stats_staff ON monthly_stats(staff_id);
CREATE INDEX IF NOT EXISTS idx_monthly_stats_date ON monthly_stats(month_date);
CREATE INDEX IF NOT EXISTS idx_strikes_staff ON strikes(staff_id);
CREATE INDEX IF NOT EXISTS idx_strikes_removed ON strikes(is_removed);
CREATE INDEX IF NOT EXISTS idx_audit_staff ON audit_log(staff_id);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_log(performed_at);
`;

async function migrate() {
  try {
    console.log('Running database migrations...');
    await pool.query(schema);
    console.log('✓ Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
