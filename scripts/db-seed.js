const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  try {
    console.log('Seeding database with sample data...');
    
    // Add sample staff
    console.log('Adding staff members...');
    const staff1 = await pool.query(
      `INSERT INTO staff (name, is_support, is_senior_support, strikes) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['John Smith', true, true, 0]
    );
    
    const staff2 = await pool.query(
      `INSERT INTO staff (name, is_support, is_senior_support, strikes) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Jane Doe', true, false, 1]
    );
    
    const staff3 = await pool.query(
      `INSERT INTO staff (name, is_support, is_senior_support, strikes) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Bob Wilson', true, true, 0]
    );
    
    const staff4 = await pool.query(
      `INSERT INTO staff (name, is_support, is_senior_support, strikes) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Alice Johnson', true, false, 2]
    );
    
    console.log('✓ Added 4 staff members');
    
    // Add current month stats
    const currentMonth = new Date();
    currentMonth.setDate(1); // First day of month
    const monthStr = currentMonth.toISOString().split('T')[0];
    
    console.log(`Adding monthly stats for ${monthStr}...`);
    
    await pool.query(
      `INSERT INTO monthly_stats 
       (staff_id, month_date, in_game_reports, forum_reports, discord_activity, quizzes_accepted, quizzes_rejected, other_activities, loa_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [staff1.rows[0].id, monthStr, 28, 6, 15, 42, 3, 8, 2]
    );
    
    await pool.query(
      `INSERT INTO monthly_stats 
       (staff_id, month_date, in_game_reports, forum_reports, discord_activity, quizzes_accepted, quizzes_rejected, other_activities, loa_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [staff2.rows[0].id, monthStr, 25, 0, 10, 35, 2, 5, 0]
    );
    
    await pool.query(
      `INSERT INTO monthly_stats 
       (staff_id, month_date, in_game_reports, forum_reports, discord_activity, quizzes_accepted, quizzes_rejected, other_activities, loa_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [staff3.rows[0].id, monthStr, 32, 7, 20, 50, 1, 12, 0]
    );
    
    await pool.query(
      `INSERT INTO monthly_stats 
       (staff_id, month_date, in_game_reports, forum_reports, discord_activity, quizzes_accepted, quizzes_rejected, other_activities, loa_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [staff4.rows[0].id, monthStr, 18, 0, 8, 28, 5, 3, 5]
    );
    
    console.log('✓ Added monthly stats for all staff');
    
    // Add sample strikes
    console.log('Adding strike records...');
    
    await pool.query(
      `INSERT INTO strikes (staff_id, reason, issued_by, issued_date) 
       VALUES ($1, $2, $3, $4)`,
      [staff2.rows[0].id, 'Missed quota for 2 consecutive months', 'ADMIN', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]
    );
    
    await pool.query(
      `INSERT INTO strikes (staff_id, reason, issued_by, issued_date) 
       VALUES ($1, $2, $3, $4)`,
      [staff4.rows[0].id, 'Inappropriate behavior in Discord', 'ADMIN', new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)]
    );
    
    await pool.query(
      `INSERT INTO strikes (staff_id, reason, issued_by, issued_date) 
       VALUES ($1, $2, $3, $4)`,
      [staff4.rows[0].id, 'Multiple unexcused absences', 'ADMIN', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)]
    );
    
    console.log('✓ Added strike records');
    
    // Add audit log entries
    console.log('Adding audit log entries...');
    
    await pool.query(
      `INSERT INTO audit_log (staff_id, action, details, performed_by, performed_at) 
       VALUES ($1, $2, $3, $4, $5)`,
      [staff1.rows[0].id, 'ADD_STAFF', 'Added new staff member: John Smith', 'ADMIN', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)]
    );
    
    await pool.query(
      `INSERT INTO audit_log (staff_id, action, details, performed_by, performed_at) 
       VALUES ($1, $2, $3, $4, $5)`,
      [staff1.rows[0].id, 'PROMOTE_SENIOR', 'Promoted to Senior Support', 'ADMIN', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)]
    );
    
    console.log('✓ Added audit log entries');
    
    console.log('\n✅ Database seeded successfully!');
    console.log('\nSample data:');
    console.log('- 4 staff members (2 Senior Support, 2 Support)');
    console.log('- Current month statistics for all staff');
    console.log('- 3 strike records across 2 staff members');
    console.log('- 2 audit log entries');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
