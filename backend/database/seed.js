require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcrypt');
const db = require('./db');

async function seed() {
  try {
    console.log('Starting database seeding...');

    // Create admin user
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    await db.query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (username) DO NOTHING;
    `, ['admin', 'admin@support.local', passwordHash, 'admin']);
    
    console.log('✓ Admin user created');
    console.log('\nDefault credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('\n⚠️  IMPORTANT: Change this password immediately after first login!\n');

    // Add sample staff members (optional)
    const sampleStaff = [
      { name: 'Alphus', is_senior: false },
      { name: 'CutieAddy', is_senior: true },
      { name: 'Dan', is_senior: true },
      { name: 'Joe', is_senior: true },
      { name: 'Smoke', is_senior: true }
    ];

    for (const staff of sampleStaff) {
      await db.query(`
        INSERT INTO staff_members (name, is_senior)
        VALUES ($1, $2)
        ON CONFLICT (name) DO NOTHING;
      `, [staff.name, staff.is_senior]);
    }
    
    console.log('✓ Sample staff members added');

    console.log('\n✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
