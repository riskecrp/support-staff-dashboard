# Migration Guide: Google Sheets to Support Staff Dashboard

This guide helps you migrate from the Google Sheets-based system to the new web-based Support Staff Dashboard.

## Table of Contents

1. [Overview](#overview)
2. [Pre-Migration Checklist](#pre-migration-checklist)
3. [Data Export from Google Sheets](#data-export-from-google-sheets)
4. [Data Transformation](#data-transformation)
5. [Database Import](#database-import)
6. [Verification](#verification)
7. [Post-Migration](#post-migration)
8. [Rollback Plan](#rollback-plan)

---

## Overview

### What Gets Migrated

- **SSRoster** → `staff` table
- **AllStats** → `monthly_stats` table
- **SupportChangesLog** → `audit_log` table
- **Name changes** → `name_aliases` table

### What Doesn't Get Migrated

- **PanelData** - Not stored in new system (used only for monthly imports)
- **ForumReports** - Not stored in new system (aggregated into monthly stats)
- **Menu/UI scripts** - Replaced by web interface

### Migration Timeline

1. **Preparation** (1-2 hours) - Export and clean data
2. **Import** (30 minutes) - Run migration scripts
3. **Verification** (1 hour) - Validate imported data
4. **Transition** (1 week) - Parallel running period
5. **Cutover** (instant) - Switch to new system

---

## Pre-Migration Checklist

### Before You Start

- [ ] Backup Google Sheets (File → Make a copy)
- [ ] Set up new dashboard and database
- [ ] Test dashboard with sample data
- [ ] Inform staff about upcoming migration
- [ ] Schedule migration during low-activity period
- [ ] Have rollback plan ready

### Required Access

- [ ] Google Sheets edit access
- [ ] Database admin access
- [ ] Server/hosting access
- [ ] Email access for notifications

---

## Data Export from Google Sheets

### Step 1: Export SSRoster

1. Open your Google Sheets document
2. Navigate to the **SSRoster** sheet
3. Select all data (including headers)
4. File → Download → Comma-separated values (.csv)
5. Save as `ssroster.csv`

**Expected columns:**
```
Name, Support, SeniorSupport
```

### Step 2: Export AllStats

1. Navigate to the **AllStats** sheet
2. Select all data (including headers)
3. File → Download → Comma-separated values (.csv)
4. Save as `allstats.csv`

**Expected columns:**
```
Date, Name, SeniorSupport, QuizzesAccepted, QuizzesRejected, Other, ForumReports, DiscordActivity, ...
```

### Step 3: Export SupportChangesLog

1. Navigate to the **SupportChangesLog** sheet
2. Select all data (including headers)
3. File → Download → Comma-separated values (.csv)
4. Save as `support_changes_log.csv`

**Expected columns:**
```
Timestamp, Name, Action, Details, PriorSenior, NewSenior
```

### Step 4: Create Migration Folder

```bash
mkdir migration-data
mv ssroster.csv migration-data/
mv allstats.csv migration-data/
mv support_changes_log.csv migration-data/
```

---

## Data Transformation

### Create Migration Script

Create `scripts/migrate-from-sheets.js`:

```javascript
const { Pool } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Normalize name for matching
function normalizeName(name) {
  if (!name) return '';
  return name
    .replace(/~[^~]*~/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Parse boolean from Google Sheets format
function parseBoolean(value) {
  if (value === true || value === 'TRUE' || value === 'true' || value === 'Yes' || value === '1') {
    return true;
  }
  return false;
}

// Parse date from various formats
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Try other formats
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  return null;
}

async function migrateSSRoster() {
  console.log('Migrating SSRoster...');
  const staffMap = {};
  const rows = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('migration-data/ssroster.csv')
      .pipe(csv())
      .on('data', (row) => {
        rows.push(row);
      })
      .on('end', async () => {
        for (const row of rows) {
          const name = row.Name?.trim();
          if (!name) continue;
          
          const isSupport = parseBoolean(row.Support);
          const isSenior = parseBoolean(row.SeniorSupport);
          
          // Only import if they are support
          if (isSupport) {
            const result = await pool.query(
              `INSERT INTO staff (name, is_support, is_senior_support, is_active)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT DO NOTHING
               RETURNING id`,
              [name, true, isSenior, true]
            );
            
            if (result.rows[0]) {
              staffMap[normalizeName(name)] = {
                id: result.rows[0].id,
                name: name
              };
            }
          }
        }
        
        console.log(`✓ Migrated ${Object.keys(staffMap).length} staff members`);
        resolve(staffMap);
      })
      .on('error', reject);
  });
}

async function migrateAllStats(staffMap) {
  console.log('Migrating AllStats...');
  const rows = [];
  let imported = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('migration-data/allstats.csv')
      .pipe(csv())
      .on('data', (row) => {
        rows.push(row);
      })
      .on('end', async () => {
        for (const row of rows) {
          const name = row.Name?.trim();
          const date = parseDate(row.Date);
          
          if (!name || !date) continue;
          
          // Find staff by name
          const normalized = normalizeName(name);
          const staff = staffMap[normalized];
          
          if (!staff) {
            console.log(`Warning: Could not find staff member: ${name}`);
            continue;
          }
          
          // Convert first day of month
          const monthDate = date.substring(0, 7) + '-01';
          
          try {
            await pool.query(
              `INSERT INTO monthly_stats 
               (staff_id, month_date, in_game_reports, forum_reports, discord_activity,
                quizzes_accepted, quizzes_rejected, other_activities, loa_days)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               ON CONFLICT (staff_id, month_date) DO UPDATE SET
                 in_game_reports = EXCLUDED.in_game_reports,
                 forum_reports = EXCLUDED.forum_reports,
                 discord_activity = EXCLUDED.discord_activity,
                 quizzes_accepted = EXCLUDED.quizzes_accepted,
                 quizzes_rejected = EXCLUDED.quizzes_rejected,
                 other_activities = EXCLUDED.other_activities,
                 loa_days = EXCLUDED.loa_days`,
              [
                staff.id,
                monthDate,
                parseInt(row.InGameReports || row.IG || 0),
                parseInt(row.ForumReports || 0),
                parseInt(row.Discord || row.DiscordActivity || 0),
                parseInt(row.QuizzesAccepted || 0),
                parseInt(row.QuizzesRejected || 0),
                parseInt(row.Other || 0),
                0  // LOA days - not in old system
              ]
            );
            imported++;
          } catch (error) {
            console.error(`Error importing stats for ${name} on ${monthDate}:`, error.message);
          }
        }
        
        console.log(`✓ Migrated ${imported} monthly stat records`);
        resolve();
      })
      .on('error', reject);
  });
}

async function migrateSupportChangesLog(staffMap) {
  console.log('Migrating SupportChangesLog...');
  const rows = [];
  let imported = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('migration-data/support_changes_log.csv')
      .pipe(csv())
      .on('data', (row) => {
        rows.push(row);
      })
      .on('end', async () => {
        for (const row of rows) {
          const name = row.Name?.trim();
          const timestamp = row.Timestamp;
          const action = row.Action?.trim();
          const details = row.Details?.trim() || '';
          
          if (!name || !timestamp || !action) continue;
          
          // Find staff by name
          const normalized = normalizeName(name);
          const staff = staffMap[normalized];
          
          if (!staff) {
            console.log(`Warning: Could not find staff for log entry: ${name}`);
            continue;
          }
          
          try {
            const parsedDate = new Date(timestamp);
            if (isNaN(parsedDate.getTime())) {
              console.log(`Warning: Invalid timestamp: ${timestamp}`);
              continue;
            }
            
            await pool.query(
              `INSERT INTO audit_log (staff_id, action, details, performed_by, performed_at)
               VALUES ($1, $2, $3, $4, $5)`,
              [staff.id, action, details, 'MIGRATION', parsedDate]
            );
            imported++;
            
            // Check for name changes
            if (action.toLowerCase().includes('name') && action.toLowerCase().includes('change')) {
              // Extract old and new names if possible
              const newNameMatch = details.match(/new.*?name.*?:\s*(.+)/i);
              if (newNameMatch) {
                const oldName = name;
                const newName = newNameMatch[1].trim();
                
                await pool.query(
                  `INSERT INTO name_aliases (staff_id, old_name, new_name, changed_at)
                   VALUES ($1, $2, $3, $4)`,
                  [staff.id, oldName, newName, parsedDate]
                );
              }
            }
          } catch (error) {
            console.error(`Error importing log entry:`, error.message);
          }
        }
        
        console.log(`✓ Migrated ${imported} audit log entries`);
        resolve();
      })
      .on('error', reject);
  });
}

async function migrate() {
  try {
    console.log('Starting migration from Google Sheets...\n');
    
    // Step 1: Migrate staff
    const staffMap = await migrateSSRoster();
    
    // Step 2: Migrate monthly stats
    await migrateAllStats(staffMap);
    
    // Step 3: Migrate audit log
    await migrateSupportChangesLog(staffMap);
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run verification queries');
    console.log('2. Check data in dashboard');
    console.log('3. Test all functionality');
    console.log('4. Run parallel for 1 week');
    console.log('5. Archive Google Sheets');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
```

### Install CSV Parser

```bash
npm install csv-parser
```

---

## Database Import

### Run Migration

```bash
# Make sure database is set up
npm run db:migrate

# Run the migration script
node scripts/migrate-from-sheets.js
```

### Expected Output

```
Starting migration from Google Sheets...

Migrating SSRoster...
✓ Migrated 25 staff members

Migrating AllStats...
✓ Migrated 450 monthly stat records

Migrating SupportChangesLog...
✓ Migrated 127 audit log entries

✅ Migration completed successfully!
```

---

## Verification

### Check Staff Count

```sql
SELECT 
  COUNT(*) as total_staff,
  COUNT(*) FILTER (WHERE is_active = true) as active_staff,
  COUNT(*) FILTER (WHERE is_senior_support = true) as senior_support
FROM staff;
```

### Check Monthly Stats

```sql
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT staff_id) as unique_staff,
  COUNT(DISTINCT month_date) as unique_months,
  MIN(month_date) as earliest_month,
  MAX(month_date) as latest_month
FROM monthly_stats;
```

### Check Audit Log

```sql
SELECT 
  COUNT(*) as total_entries,
  COUNT(DISTINCT staff_id) as unique_staff,
  MIN(performed_at) as earliest_entry,
  MAX(performed_at) as latest_entry
FROM audit_log;
```

### Compare with Google Sheets

1. Count rows in each Google Sheet
2. Compare with SQL query results
3. Spot-check individual records
4. Verify calculations match

---

## Post-Migration

### Clean Up

```bash
# Archive migration files
mkdir migration-archive
mv migration-data/* migration-archive/
gzip migration-archive/*.csv
```

### Update Documentation

- Update README with new URLs
- Share User Guide with staff
- Conduct training session

### Parallel Running

**Week 1-2:** Run both systems in parallel
- Continue updating Google Sheets
- Also update new dashboard
- Compare results daily

**Week 3:** Dashboard primary
- Use dashboard as main system
- Keep Google Sheets as backup (read-only)

**Week 4:** Full cutover
- Archive Google Sheets
- Dashboard is only system

---

## Rollback Plan

### If Migration Fails

1. **Keep Google Sheets intact** (don't delete)
2. **Drop imported data:**
```sql
TRUNCATE TABLE audit_log CASCADE;
TRUNCATE TABLE monthly_stats CASCADE;
TRUNCATE TABLE strikes CASCADE;
TRUNCATE TABLE name_aliases CASCADE;
TRUNCATE TABLE staff CASCADE;
```
3. **Fix issues in migration script**
4. **Re-run migration**

### If Dashboard Has Issues Post-Cutover

1. **Immediately revert to Google Sheets**
2. **Export any new data from dashboard**
3. **Investigate and fix issues**
4. **Plan new cutover date**

---

## Troubleshooting

### Name Matching Issues

**Problem:** Staff names don't match between sheets

**Solution:**
1. Manually create mappings
2. Update name_aliases table
3. Re-run specific portions of migration

### Date Format Issues

**Problem:** Dates not parsing correctly

**Solution:**
1. Standardize date format in Google Sheets
2. Export again
3. Update parseDate function

### Missing Data

**Problem:** Some records didn't import

**Solution:**
1. Check migration script logs
2. Identify missing records
3. Manually import if needed
4. Update script for future runs

---

## Best Practices

1. **Never delete Google Sheets** until 100% confident
2. **Test migration on sample data** first
3. **Run verification queries** thoroughly
4. **Communicate with team** throughout process
5. **Document any issues** encountered
6. **Keep migration scripts** for future reference

---

## Support

For migration assistance:
- Review script logs
- Check verification queries
- Consult DATABASE_SCHEMA.md
- Contact system administrator

---

Last Updated: February 2026
