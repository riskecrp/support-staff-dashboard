# Database Schema

This document describes the PostgreSQL database schema for the Support Staff Dashboard.

## Tables Overview

- **staff** - Core staff member information
- **monthly_stats** - Monthly performance statistics
- **strikes** - Strike records with history
- **audit_log** - Audit trail of all changes
- **name_aliases** - Historical name changes for matching

---

## Table: `staff`

Stores information about support staff members.

```sql
CREATE TABLE staff (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  is_support BOOLEAN DEFAULT true,
  is_senior_support BOOLEAN DEFAULT false,
  strikes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);
```

### Columns

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key, auto-incrementing |
| name | VARCHAR(255) | Staff member's full name |
| is_support | BOOLEAN | Whether the person is a support staff member |
| is_senior_support | BOOLEAN | Whether the person is senior support |
| strikes | INTEGER | Current number of active strikes (cached for performance) |
| created_at | TIMESTAMP | When the staff member was added |
| updated_at | TIMESTAMP | When the record was last updated |
| is_active | BOOLEAN | Whether the staff member is currently active (soft delete) |

### Indexes

```sql
CREATE INDEX idx_staff_active ON staff(is_active);
CREATE INDEX idx_staff_support ON staff(is_support);
```

### Business Rules

- When `is_active = FALSE`, the staff member is effectively removed
- `strikes` is denormalized for performance; always recalculate from strikes table
- When strikes reach 3:
  - Senior Support → Demoted to regular Support (`is_senior_support = FALSE`)
  - Regular Support → Removed (`is_support = FALSE`, `is_active = FALSE`)

---

## Table: `monthly_stats`

Stores monthly performance statistics for each staff member.

```sql
CREATE TABLE monthly_stats (
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
```

### Columns

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| staff_id | INTEGER | Foreign key to staff table |
| month_date | DATE | First day of the month (YYYY-MM-01) |
| in_game_reports | INTEGER | Number of in-game reports handled |
| forum_reports | INTEGER | Number of forum reports handled |
| discord_activity | INTEGER | Discord activity count |
| quizzes_accepted | INTEGER | Number of quizzes accepted |
| quizzes_rejected | INTEGER | Number of quizzes rejected |
| other_activities | INTEGER | Other miscellaneous activities |
| loa_days | INTEGER | Number of LOA (Leave of Absence) days |
| created_at | TIMESTAMP | When the record was created |
| updated_at | TIMESTAMP | When the record was last updated |

### Indexes

```sql
CREATE INDEX idx_monthly_stats_staff ON monthly_stats(staff_id);
CREATE INDEX idx_monthly_stats_date ON monthly_stats(month_date);
```

### Business Rules

- `month_date` should always be the first day of the month
- UNIQUE constraint on `(staff_id, month_date)` prevents duplicate entries
- LOA days affect quota calculations: `adjusted_ig_quota = 30 - loa_days`
- Use upsert (INSERT ... ON CONFLICT) when updating monthly stats

---

## Table: `strikes`

Stores strike records with full history including removed strikes.

```sql
CREATE TABLE strikes (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER REFERENCES staff(id),
  issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reason TEXT,
  issued_by VARCHAR(255),
  is_removed BOOLEAN DEFAULT false,
  removed_date TIMESTAMP,
  removed_by VARCHAR(255)
);
```

### Columns

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| staff_id | INTEGER | Foreign key to staff table |
| issued_date | TIMESTAMP | When the strike was issued |
| reason | TEXT | Reason for the strike |
| issued_by | VARCHAR(255) | Who issued the strike |
| is_removed | BOOLEAN | Whether the strike has been removed |
| removed_date | TIMESTAMP | When the strike was removed (if applicable) |
| removed_by | VARCHAR(255) | Who removed the strike (if applicable) |

### Indexes

```sql
CREATE INDEX idx_strikes_staff ON strikes(staff_id);
CREATE INDEX idx_strikes_removed ON strikes(is_removed);
```

### Business Rules

- Strikes are NEVER hard-deleted (maintain audit trail)
- Only count strikes where `is_removed = FALSE` for active strike count
- When a strike is added, check if staff reaches 3 strikes (auto-action)
- When a strike is removed, recalculate strike count in staff table

---

## Table: `audit_log`

Complete audit trail of all staff management actions.

```sql
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER REFERENCES staff(id),
  action VARCHAR(100) NOT NULL,
  details TEXT,
  old_value TEXT,
  new_value TEXT,
  performed_by VARCHAR(255),
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Columns

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| staff_id | INTEGER | Foreign key to staff table |
| action | VARCHAR(100) | Type of action (ADD_STAFF, UPDATE_STAFF, etc.) |
| details | TEXT | Human-readable description of the action |
| old_value | TEXT | Previous value (if applicable) |
| new_value | TEXT | New value (if applicable) |
| performed_by | VARCHAR(255) | Who performed the action |
| performed_at | TIMESTAMP | When the action was performed |

### Indexes

```sql
CREATE INDEX idx_audit_staff ON audit_log(staff_id);
CREATE INDEX idx_audit_date ON audit_log(performed_at);
```

### Common Actions

- `ADD_STAFF` - New staff member added
- `UPDATE_STAFF` - Staff member information updated
- `REMOVE_STAFF` - Staff member removed (soft delete)
- `PROMOTE_SENIOR` - Promoted to Senior Support
- `DEMOTE_SENIOR` - Demoted from Senior Support
- `AUTO_DEMOTE` - Automatic demotion due to 3 strikes
- `AUTO_REMOVE` - Automatic removal due to 3 strikes
- `NAME_CHANGE` - Staff member name changed

---

## Table: `name_aliases`

Tracks historical name changes for fuzzy matching.

```sql
CREATE TABLE name_aliases (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER REFERENCES staff(id),
  old_name VARCHAR(255) NOT NULL,
  new_name VARCHAR(255) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Columns

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| staff_id | INTEGER | Foreign key to staff table |
| old_name | VARCHAR(255) | Previous name |
| new_name | VARCHAR(255) | New name |
| changed_at | TIMESTAMP | When the name was changed |

### Purpose

This table enables:
1. Tracking complete name change history
2. Fuzzy name matching when importing data from external sources
3. Maintaining consistency across historical data

---

## Relationships

```
staff (1) ----< (many) monthly_stats
staff (1) ----< (many) strikes
staff (1) ----< (many) audit_log
staff (1) ----< (many) name_aliases
```

---

## Data Integrity

### Foreign Key Constraints
- All child tables reference `staff(id)` with foreign keys
- No cascading deletes (use soft deletes instead)

### Unique Constraints
- `monthly_stats`: `UNIQUE(staff_id, month_date)` - one record per staff per month

### Check Constraints (Future Enhancement)
Consider adding:
```sql
ALTER TABLE staff ADD CONSTRAINT check_strikes_range CHECK (strikes >= 0 AND strikes <= 3);
ALTER TABLE monthly_stats ADD CONSTRAINT check_loa_days CHECK (loa_days >= 0 AND loa_days <= 31);
```

---

## Backup and Maintenance

### Backup Strategy
- Daily automated backups of entire database
- Weekly backups retained for 3 months
- Monthly backups retained for 1 year

### Maintenance Tasks
- Run `VACUUM ANALYZE` weekly to optimize performance
- Monitor index usage and add indexes as needed
- Archive audit_log entries older than 2 years

---

## Migration from Google Sheets

When migrating from Google Sheets:

1. **SSRoster → staff table**
   - Map Name → name
   - Map Support (boolean) → is_support
   - Map SeniorSupport (boolean) → is_senior_support

2. **AllStats → monthly_stats table**
   - Map Date → month_date (convert to first of month)
   - Map Name → staff_id (use name matching)
   - Parse and map statistics columns

3. **SupportChangesLog → audit_log table**
   - Map Timestamp → performed_at
   - Map Name → staff_id (lookup by name)
   - Map Action → action
   - Map Details → details

4. **Use fuzzy name matching** for inconsistent names
   - Apply Levenshtein distance algorithm
   - Normalize names (remove special characters, lowercase)
   - Match with threshold of 20% of string length
