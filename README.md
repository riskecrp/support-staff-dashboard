# Support Staff Dashboard

A comprehensive web-based dashboard to manage support staff activity tracking, strikes, and leave of absence (LOA) with automated quota calculations.

## Features

- **Staff Management**: Add, update, remove support staff members with role management
- **Strikes System**: Track strikes with automatic demotion/removal at 3 strikes
- **LOA Tracking**: Track leave of absence days per staff member per month
- **Quota System**: Automated quota calculations with LOA adjustments
- **Monthly Stats**: Entry and viewing of monthly performance statistics
- **Audit Log**: Complete audit trail of all staff management changes
- **Historical Data**: View trends and historical performance
- **Fuzzy Name Matching**: Intelligent name matching using Levenshtein distance

## Tech Stack

- **Frontend**: Next.js 14 with React 18 and TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Native pg driver with custom query builder

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/riskecrp/support-staff-dashboard.git
cd support-staff-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and configure your database connection:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/support_staff_db
```

4. Create the database:
```bash
createdb support_staff_db
```

5. Run migrations:
```bash
npm run db:migrate
```

6. (Optional) Seed with sample data:
```bash
npm run db:seed
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
support-staff-dashboard/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── pages/
│   └── api/              # API routes
│       ├── staff/        # Staff management endpoints
│       ├── strikes/      # Strikes endpoints
│       ├── stats/        # Monthly stats endpoints
│       ├── quotas/       # Quota calculation endpoints
│       └── audit/        # Audit log endpoints
├── lib/                  # Shared utilities
│   ├── db.ts            # Database connection
│   ├── quotas.ts        # Quota calculation logic
│   ├── name-matching.ts # Fuzzy name matching
│   └── strikes.ts       # Strike management logic
├── components/          # React components (to be built)
├── scripts/            # Utility scripts
│   ├── db-migrate.js  # Database migration
│   └── db-seed.js     # Seed data script
└── public/            # Static assets
```

## API Endpoints

### Staff Management
- `GET /api/staff` - List all staff (with filters)
- `GET /api/staff/:id` - Get staff details
- `POST /api/staff` - Add new staff member
- `PUT /api/staff/:id` - Update staff (promote/demote/change name)
- `DELETE /api/staff/:id` - Remove staff (soft delete)

### Strikes
- `GET /api/staff/:id/strikes` - Get all strikes for staff member
- `POST /api/staff/:id/strikes` - Add strike
- `DELETE /api/strikes/:id` - Remove strike

### Monthly Stats
- `GET /api/stats?month=YYYY-MM-DD` - Get stats for specific month
- `POST /api/stats` - Create/update monthly stats entry
- `GET /api/stats/current` - Get current month stats with quota calculations

## Quota Rules

**Base Quotas (Monthly):**
- Support Staff: 30 in-game reports
- Senior Support: 30 in-game reports + 5 forum reports

**LOA Adjustments:**
- Each LOA day reduces in-game report quota by 1
- Forum report quota is NOT affected by LOA
- Minimum quota is 0

**Color Coding:**
- 🟢 Green: ≥ 100% of quota met
- 🟡 Yellow: 75-99% of quota met
- 🔴 Red: < 75% of quota met

## Strike System

- Each staff member can accumulate strikes
- Strikes are logged with timestamp, reason, and issuer
- **At 3 strikes:**
  - Senior Support → Demoted to regular Support
  - Regular Support → Removed from staff (deactivated)

## Database Schema

See `scripts/db-migrate.js` for the complete database schema including:
- staff
- monthly_stats
- strikes
- audit_log
- name_aliases

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, please open an issue on GitHub.
