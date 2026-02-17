# Support Staff Dashboard - Copilot Instructions

## Project Overview

This is a comprehensive web-based dashboard for managing support staff activity tracking, strikes, leave of absence (LOA), and automated quota calculations. The system provides real-time monitoring of staff performance with intelligent name matching and automated enforcement of strike policies.

**Purpose:** Replace a legacy Google Sheets-based support staff tracker with a modern, scalable web application.

**Key Features:**
- Staff management with role hierarchy (Support, Senior Support)
- Automatic strike enforcement (3 strikes = demotion/removal)
- LOA tracking with automatic quota adjustments
- Monthly statistics with color-coded progress indicators
- Fuzzy name matching using Levenshtein distance algorithm
- Complete audit trail of all changes
- Historical data and trend analysis

## Tech Stack

### Core Technologies
- **Frontend Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Language:** TypeScript 5.4+
- **Styling:** Tailwind CSS 3.4
- **Database:** PostgreSQL 12+
- **Database Driver:** pg (native PostgreSQL driver)
- **Validation:** Zod 3.22

### Runtime Requirements
- Node.js 18 or higher
- PostgreSQL 12 or higher
- npm or yarn package manager

## Coding Guidelines & Conventions

### TypeScript Standards
- **Use TypeScript for all new files** - no plain JavaScript except config files
- **Strict mode enabled** - respect all TypeScript compiler strictness settings
- **Type everything explicitly** - avoid `any` unless absolutely necessary
- **Use Zod for runtime validation** - especially for API request/response validation

### React & Next.js Conventions
- **Functional components only** - use React Hooks, no class components
- **Server Components by default** - use `'use client'` directive only when needed (interactivity, browser APIs)
- **API Routes in pages/api/** - follow Next.js Pages Router convention for API endpoints
- **Use App Router for pages** - new pages go in the `app/` directory

### Code Style
- **Arrow functions preferred** - use arrow functions for consistency
- **Async/await over promises** - cleaner error handling with try-catch
- **Descriptive variable names** - prefer `staffMemberId` over `id`, `monthlyStats` over `data`
- **camelCase for variables and functions** - follow JavaScript conventions
- **PascalCase for components and types** - React component and TypeScript type naming
- **UPPER_SNAKE_CASE for constants** - `const MAX_STRIKES = 3`

### Database Conventions
- **Use parameterized queries** - ALWAYS use `$1, $2` placeholders, never string concatenation
- **Snake_case for database columns** - `staff_id`, `is_senior`, `created_at`
- **Soft deletes with is_active flag** - never hard delete staff records
- **Timestamp columns** - `created_at`, `updated_at` for all tables

### File Organization
- **One component per file** - keep files focused and maintainable
- **Co-locate related code** - API routes in `pages/api/`, utilities in `lib/`, components in `components/`
- **Shared utilities in lib/** - database connection, quota logic, name matching algorithms

### Error Handling
- **Always wrap database calls in try-catch** - handle errors gracefully
- **Return meaningful HTTP status codes** - 400 for bad requests, 404 for not found, 500 for server errors
- **Log errors to console** - use `console.error()` for debugging
- **Return error details in development** - helpful for debugging, sanitize in production

### API Response Format
- **Consistent JSON structure:**
  ```typescript
  // Success response
  { success: true, data: {...} }
  
  // Error response
  { success: false, error: "Error message" }
  ```

## Project Structure

```
support-staff-dashboard/
├── app/                    # Next.js App Router pages (frontend)
│   ├── globals.css        # Global Tailwind styles
│   ├── layout.tsx         # Root layout with navigation
│   ├── page.tsx           # Home page with dashboard
│   ├── staff/             # Staff management pages
│   └── stats/             # Statistics pages
│
├── pages/api/             # Next.js API Routes (backend)
│   ├── staff/            # Staff CRUD endpoints
│   │   ├── index.ts      # GET /api/staff (list), POST /api/staff (create)
│   │   ├── [id].ts       # GET/PUT/DELETE /api/staff/:id
│   │   └── [id]/strikes.ts  # GET/POST /api/staff/:id/strikes
│   ├── strikes/
│   │   └── [id].ts       # DELETE /api/strikes/:id
│   └── stats/            # Monthly statistics endpoints
│       ├── index.ts      # GET/POST /api/stats
│       └── current.ts    # GET /api/stats/current (with quota calculations)
│
├── lib/                   # Shared utilities and business logic
│   ├── db.ts             # PostgreSQL connection pool
│   ├── quotas.ts         # Quota calculation logic
│   ├── name-matching.ts  # Levenshtein distance fuzzy matching
│   └── strikes.ts        # Strike enforcement logic
│
├── scripts/              # Database and utility scripts
│   ├── db-migrate.js     # Database schema migration
│   └── db-seed.js        # Seed data for development
│
├── components/           # React components (future use)
├── public/               # Static assets
└── [Config files]        # TypeScript, Tailwind, Next.js configs
```

### Key Files to Know
- **lib/db.ts** - Database connection pool, ALL database queries go through this
- **lib/quotas.ts** - Business logic for calculating adjusted quotas based on LOA
- **lib/name-matching.ts** - Fuzzy name matching algorithm (Levenshtein distance)
- **lib/strikes.ts** - Automatic demotion/removal logic when staff reaches 3 strikes
- **scripts/db-migrate.js** - Complete database schema definition

## Google Apps Script Files

The repository root contains Google Apps Script files (no file extension, JavaScript content):
- `AddSupport` - Add new support staff to roster
- `RemoveSupport` - Remove staff member
- `PromoteSupport` - Promote to senior support
- `DemoteSupport` - Demote to regular support
- `ChangeSupportAlias` - Update staff member name
- `PrepareMonthlyStats` - Prepare monthly statistics report
- `CompleteMonthlyStats` - Complete monthly statistics with comparisons
- `MenuAdd` - Spreadsheet menu builder

**These are legacy files for reference only.** The new implementation uses the Next.js/TypeScript stack. Do NOT modify these files unless explicitly asked.

## Business Logic

### Strike System Rules
- Each staff member can receive strikes (tracked with reason, timestamp, issuer)
- Visual indicators: 1 strike = yellow, 2 strikes = red, 3 strikes = bold red
- **Automatic enforcement at 3 strikes:**
  - Senior Support → Demoted to regular Support (remains active)
  - Regular Support → Removed from roster (is_active = false)
- Strikes can be manually removed (logged in audit trail)

### Quota System Rules
- **Base quotas (monthly):**
  - Support Staff: 30 in-game reports
  - Senior Support: 30 in-game reports + 5 forum reports
- **LOA adjustments:**
  - Each LOA day reduces in-game report quota by 1
  - Forum report quota is NOT affected by LOA
  - Minimum quota is 0 (never negative)
- **Color coding:**
  - 🟢 Green: ≥ 100% of quota met
  - 🟡 Yellow: 75-99% of quota met  
  - 🔴 Red: < 75% of quota met

### Name Matching Algorithm
- Uses Levenshtein distance for fuzzy matching
- Threshold: 20% of string length OR 2 characters (whichever is larger)
- Normalizes names: lowercase, trim whitespace
- Strips surrounding notes/special characters
- Exact match always preferred before fuzzy matching

## Build & Test Commands

### Development
```bash
npm install          # Install dependencies
npm run dev          # Start development server on http://localhost:3000
```

### Database
```bash
npm run db:migrate   # Create database schema (run once)
npm run db:seed      # Populate with sample data (optional)
```

### Production
```bash
npm run build        # Build optimized production bundle
npm start            # Start production server
```

### Linting
```bash
npm run lint         # Run ESLint checks
```

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Configure `DATABASE_URL` with PostgreSQL connection string:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/support_staff_db
   ```

## Database Schema

### Core Tables
- **staff** - Staff member records (name, role, status)
- **monthly_stats** - Performance stats per staff per month
- **strikes** - Strike records with reasons and timestamps
- **audit_log** - Complete audit trail of all changes
- **name_aliases** - Alternative names for fuzzy matching

### Important Columns
- `is_active` - Soft delete flag (false = removed)
- `is_senior_support` - Role flag (true = Senior Support, false = Support)
- `loa_days` - Leave of absence days per month
- `in_game_reports`, `forum_reports` - Activity counters

## API Conventions

### Request Methods
- `GET` - Retrieve data (list or single record)
- `POST` - Create new records
- `PUT` - Update existing records (full updates)
- `DELETE` - Soft delete (sets is_active = false)

### Query Parameters
- Use query strings for filtering: `GET /api/staff?is_active=true`
- Use URL parameters for IDs: `GET /api/staff/123`

### Authentication
**Currently not implemented.** This is an internal tool. Authentication/authorization should be added before public deployment.

## Documentation Resources

- [README.md](../README.md) - Getting started, installation, and overview
- [PROJECT_SUMMARY.md](../PROJECT_SUMMARY.md) - Complete feature list and implementation details
- [API_DOCUMENTATION.md](../API_DOCUMENTATION.md) - Detailed API endpoint documentation
- [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) - Database schema and relationships
- [DEPLOYMENT.md](../DEPLOYMENT.md) - Deployment instructions and environment setup
- [USER_GUIDE.md](../USER_GUIDE.md) - End-user documentation
- [MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md) - Migrating from Google Sheets

## Common Tasks

### Adding a New API Endpoint
1. Create file in `pages/api/[resource]/`
2. Export async handler function
3. Use Zod to validate request body
4. Query database using `lib/db.ts` pool
5. Return consistent JSON response format
6. Add error handling with try-catch

### Adding a New Page
1. Create file in `app/[page-name]/page.tsx`
2. Use Server Component by default
3. Fetch data directly in component (Server Components can be async)
4. Use `'use client'` only if interactivity needed
5. Import styles from `app/globals.css`

### Modifying Database Schema
1. Update `scripts/db-migrate.js` with new schema changes
2. Run `npm run db:migrate` to apply changes
3. Update TypeScript types to match new schema
4. Update Zod validation schemas if needed

## Important Notes

- **Never hardcode database credentials** - use environment variables
- **Never use SELECT *** - explicitly list columns needed
- **Always validate user input** - use Zod schemas for API requests
- **Test quota calculations** - ensure LOA adjustments work correctly
- **Preserve audit trail** - log all significant changes
- **Use soft deletes** - never permanently delete staff records

## Future Enhancements (Not Yet Implemented)

- Frontend UI components (currently minimal)
- User authentication and authorization
- Role-based access control (admin vs. viewer)
- Real-time notifications for strikes
- Data export functionality
- Advanced reporting and analytics
- Mobile-responsive design improvements
