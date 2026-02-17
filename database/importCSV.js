require('dotenv').config({ path: '../backend/.env' });
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const db = require('../backend/database/db');

async function importCSV() {
  try {
    console.log('Starting CSV import...\n');

    // Read CSV file
    const csvFile = process.argv[2] || './activity_data.csv';
    
    if (!fs.existsSync(csvFile)) {
      console.error(`Error: File not found: ${csvFile}`);
      console.log('\nUsage: node importCSV.js [path-to-csv-file]');
      console.log('Example: node importCSV.js ./my_data.csv');
      process.exit(1);
    }

    const fileContent = fs.readFileSync(csvFile, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    console.log(`Found ${records.length} records in CSV\n`);

    // First, get or create all staff members
    const staffMap = new Map();
    const uniqueStaff = [...new Set(records.map(r => r['Staff Name'] || r.name))];

    console.log('Creating staff members...');
    for (const staffName of uniqueStaff) {
      if (!staffName) continue;

      const isSenior = records.find(r => 
        (r['Staff Name'] || r.name) === staffName && 
        (r.Senior === 'TRUE' || r.is_senior === 'true' || r.Senior === true)
      );

      try {
        const result = await db.query(`
          INSERT INTO staff_members (name, is_senior)
          VALUES ($1, $2)
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `, [staffName, !!isSenior]);
        
        staffMap.set(staffName, result.rows[0].id);
        console.log(`  ✓ ${staffName} ${isSenior ? '(Senior)' : ''}`);
      } catch (error) {
        console.error(`  ✗ Failed to create ${staffName}:`, error.message);
      }
    }

    console.log(`\nImporting activity logs...`);
    let imported = 0;
    let skipped = 0;

    for (const record of records) {
      const staffName = record['Staff Name'] || record.name;
      const staffId = staffMap.get(staffName);

      if (!staffId) {
        console.log(`  ⊘ Skipping record for unknown staff: ${staffName}`);
        skipped++;
        continue;
      }

      try {
        await db.query(`
          INSERT INTO activity_logs (
            staff_id,
            log_date,
            quizzes_accepted,
            quizzes_rejected,
            reports_completed,
            total_forum_reports,
            total_discord,
            new_ig_reports,
            new_forum_reports,
            new_discord,
            strike_given,
            loa_days
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (staff_id, log_date) DO NOTHING
        `, [
          staffId,
          record.Date || record.log_date,
          parseInt(record['Quizzes Accepted'] || record.quizzes_accepted || 0),
          parseInt(record['Quizzes Rejected'] || record.quizzes_rejected || 0),
          parseInt(record['Reports Completed'] || record.reports_completed || 0),
          parseInt(record['Total Forum Reports'] || record.total_forum_reports || 0),
          parseInt(record['Total Discord'] || record.total_discord || 0),
          parseInt(record['New IG Reports'] || record.new_ig_reports || 0),
          parseInt(record['New Forum Reports'] || record.new_forum_reports || 0),
          parseInt(record['New Discord'] || record.new_discord || 0),
          record['Strike Given'] === 'TRUE' || record.strike_given === 'true',
          parseInt(record['LOA Days'] || record.loa_days || 0)
        ]);

        imported++;
        if (imported % 50 === 0) {
          console.log(`  Imported ${imported} records...`);
        }
      } catch (error) {
        console.error(`  ✗ Failed to import record:`, error.message);
        skipped++;
      }
    }

    console.log(`\n✅ Import complete!`);
    console.log(`   Imported: ${imported} records`);
    console.log(`   Skipped: ${skipped} records`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

importCSV();
