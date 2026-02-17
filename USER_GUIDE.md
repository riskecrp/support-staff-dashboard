# User Guide

Welcome to the Support Staff Dashboard! This guide will help you understand how to use the system effectively.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Home](#dashboard-home)
3. [Staff Management](#staff-management)
4. [Monthly Stats Dashboard](#monthly-stats-dashboard)
5. [Understanding Quotas](#understanding-quotas)
6. [Strikes System](#strikes-system)
7. [LOA (Leave of Absence)](#loa-leave-of-absence)
8. [FAQ](#faq)

---

## Getting Started

### Accessing the Dashboard

1. Open your web browser
2. Navigate to the dashboard URL (e.g., `http://localhost:3000` for development)
3. You'll see the dashboard home page with quick access cards

### Navigation

The dashboard consists of several main sections:
- **Home** - Overview and quick access
- **Staff Management** - Add, view, and manage staff members
- **Monthly Stats** - View current month performance with quotas
- **Documentation** - API docs and guides

---

## Dashboard Home

The home page provides:
- Welcome message
- Quick access cards to main features
- Links to documentation

**Quick Access Cards:**
1. **Staff Management** - Click to view and manage staff members
2. **Monthly Stats** - Click to view current month performance
3. **Documentation** - Links to GitHub for detailed docs

---

## Staff Management

### Viewing Staff

1. Click **"Staff Management"** from the home page or navigate to `/staff`
2. You'll see a table with all active staff members showing:
   - Name
   - Role (Support or Senior Support)
   - Current strikes count
   - Quick actions

### Summary Cards

At the top of the page, you'll see three summary cards:
- **Total Active Staff** - Count of currently active staff
- **Senior Support** - Count of senior support members
- **With Strikes** - Count of staff with one or more strikes

### Adding New Staff

1. Click the **"+ Add Staff"** button (top right)
2. A modal dialog will appear
3. Enter the staff member's name
4. Check **"Senior Support"** if they should start as senior support
5. Click **"Add Staff"** to confirm or **"Cancel"** to abort

### Viewing Staff Details

1. In the staff list, click **"View Details"** next to any staff member
2. This will take you to the individual staff member page (future feature)
3. You'll be able to:
   - View complete history
   - Add/remove strikes
   - Promote/demote
   - Edit LOA days
   - View monthly performance

---

## Monthly Stats Dashboard

### Accessing Monthly Stats

1. Click **"Monthly Stats"** from the home page or navigate to `/stats`
2. You'll see the current month's performance for all active staff

### Understanding the Dashboard

Each staff member is displayed in a card showing:

**Header Section:**
- Staff member name
- Role badge (Support or Senior Support)
- Strike warning (if applicable)

**LOA Notification:**
- Appears if the staff member has LOA days this month
- Shows number of LOA days
- Indicated by 🏖 icon

**Progress Bars:**
1. **In-Game Reports**
   - Shows actual vs required reports
   - Color-coded by status (green/yellow/red)
   - Adjusted for LOA days

2. **Forum Reports** (Senior Support only)
   - Shows actual vs required reports
   - Color-coded by status
   - NOT adjusted for LOA days

**Additional Stats:**
- Discord Activity count
- Quizzes accepted count

### Color Coding

- 🟢 **Green** (Success): 100% or more of quota met
- 🟡 **Yellow** (Warning): 75-99% of quota met
- 🔴 **Red** (Danger): Less than 75% of quota met

### Card Border Colors

- **Green** - All quotas met
- **Yellow** - At least one quota in warning range
- **Red** - At least one quota in danger range

---

## Understanding Quotas

### Base Quotas (Monthly)

**Support Staff:**
- 30 in-game reports

**Senior Support:**
- 30 in-game reports
- 5 forum reports

### LOA Adjustments

**For In-Game Reports:**
- Each LOA day reduces the quota by 1
- Formula: `adjusted_quota = 30 - loa_days`
- Minimum quota is 0 (cannot go negative)

**Example:**
- Staff member has 5 LOA days
- Base quota: 30 in-game reports
- Adjusted quota: 25 in-game reports (30 - 5)

**For Forum Reports:**
- LOA days DO NOT affect forum report quota
- Forum quota remains 5 for all Senior Support

### Quota Calculation Examples

**Example 1: Regular Support, No LOA**
- Required: 30 in-game reports
- Actual: 28 in-game reports
- Percentage: 93.3% (Yellow/Warning)

**Example 2: Senior Support, 3 LOA Days**
- Required: 27 in-game reports (30 - 3), 5 forum reports
- Actual: 27 in-game, 6 forum reports
- Percentage: 100% IG (Green), 120% Forum (Green)

**Example 3: Regular Support, 10 LOA Days**
- Required: 20 in-game reports (30 - 10)
- Actual: 15 in-game reports
- Percentage: 75% (Yellow/Warning)

---

## Strikes System

### What Are Strikes?

Strikes are warnings issued to staff members for:
- Missing quotas for consecutive months
- Inappropriate behavior
- Policy violations
- Other disciplinary reasons

### Strike Limits

Each staff member can have up to **3 strikes**.

### Auto-Actions at 3 Strikes

When a staff member reaches 3 strikes:

**For Senior Support:**
- Automatically **demoted** to regular Support
- Can continue as regular support
- Strike count resets to 3 (they keep the strikes)

**For Regular Support:**
- Automatically **removed** from staff
- Account deactivated (`is_active = false`)
- Can be reinstated manually later

### Strike Indicators

**In Staff List:**
- Shows "X / 3" strikes for each member
- Color coding:
  - 0 strikes: Gray (no concern)
  - 1 strike: Yellow (warning)
  - 2 strikes: Red (serious warning)
  - 3 strikes: Dark red + bold (auto-action triggered)

**In Monthly Stats:**
- Strike warning appears in top-right of card
- Shows "⚠ X Strike(s)" with color coding

### Viewing Strike History

1. Go to staff member's detail page
2. View all strikes including:
   - Date issued
   - Reason
   - Who issued it
   - Whether it was removed

### Adding a Strike

1. Navigate to staff member's detail page
2. Click **"Add Strike"**
3. Enter the reason
4. Click **"Submit"**
5. System will check if auto-action is needed

### Removing a Strike

Strikes can be removed by administrators:
1. View staff member's strike history
2. Click **"Remove"** next to the strike
3. Confirm the removal
4. Strike count will be recalculated

**Note:** Removed strikes remain in the database for audit purposes but don't count toward the active total.

---

## LOA (Leave of Absence)

### What is LOA?

LOA (Leave of Absence) days are days when a staff member is away and unable to fulfill their duties.

### How LOA Affects Quotas

- Each LOA day **reduces in-game report quota by 1**
- LOA days **DO NOT affect forum report quota**
- Maximum practical LOA: 30 days (reduces quota to 0)

### Recording LOA Days

LOA days are recorded as part of monthly statistics:
1. When entering monthly stats (via API or future form)
2. Include the `loa_days` field
3. System automatically adjusts quotas

### LOA Display

On the Monthly Stats Dashboard:
- LOA days appear in a blue notification box
- Shows: "🏖 X LOA day(s) this month"
- Appears above the progress bars

### LOA Best Practices

1. **Record LOA in advance** - Enter expected LOA days at the beginning of the month
2. **Update if plans change** - Adjust LOA days if leave is extended or shortened
3. **Document reasons** - Keep notes in audit log for why LOA was granted
4. **Review quotas** - Ensure adjusted quotas are reasonable

---

## FAQ

### General Questions

**Q: Who can access the dashboard?**
A: Currently, there's no authentication. In production, add proper access control.

**Q: Can I access the dashboard on mobile?**
A: Yes! The dashboard is responsive and works on tablets and phones.

**Q: How often is data updated?**
A: Data is real-time. Any changes are reflected immediately.

### Staff Management

**Q: Can I undo removing a staff member?**
A: Yes, removals are "soft deletes". Update the staff record via API to reactivate.

**Q: What happens when someone is promoted to Senior Support?**
A: Their forum report quota changes from 0 to 5 starting the next month.

**Q: Can I change a staff member's name?**
A: Yes, use the update staff API. The old name is saved in name_aliases table.

### Stats and Quotas

**Q: When should I enter monthly stats?**
A: Enter stats at the beginning of each month for the previous month.

**Q: What if someone joins mid-month?**
A: Prorate their quota or record their start date in LOA days.

**Q: Can quotas be customized per person?**
A: Not currently. Future enhancement could add custom quotas.

### Strikes

**Q: Do strikes expire?**
A: No, strikes remain until manually removed by an administrator.

**Q: Can someone come back after being auto-removed?**
A: Yes, an administrator can reactivate their account and reset strikes.

**Q: What happens to historical data when someone is removed?**
A: All historical data is preserved. The person just becomes inactive.

### Technical

**Q: Where is data stored?**
A: In a PostgreSQL database. See DATABASE_SCHEMA.md for details.

**Q: Can I export data?**
A: Use the API to retrieve data in JSON format. CSV export is a future feature.

**Q: How do I backup data?**
A: Use standard PostgreSQL backup tools (`pg_dump`).

---

## Getting Help

- **API Documentation**: See `API_DOCUMENTATION.md`
- **Database Schema**: See `DATABASE_SCHEMA.md`
- **Setup Instructions**: See `README.md`
- **Deployment Guide**: See `DEPLOYMENT.md`
- **GitHub Issues**: Report bugs or request features on GitHub

---

## Tips for Success

1. **Enter stats consistently** - Do it at the same time each month
2. **Review quotas regularly** - Check the dashboard weekly
3. **Address strikes promptly** - Don't let strikes accumulate
4. **Document LOA properly** - Keep accurate records
5. **Communicate with staff** - Let them see their progress
6. **Use the audit log** - Review history when needed

---

## Keyboard Shortcuts

(Future feature - to be implemented)

---

## Updates and Changes

Check the GitHub repository for:
- Version history
- Changelog
- Upcoming features
- Bug fixes

---

Last Updated: February 2026
