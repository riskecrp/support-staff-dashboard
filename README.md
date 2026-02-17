# Support Staff Activity Dashboard

## 🚀 Complete Step-by-Step Railway Deployment Guide

### Prerequisites
- GitHub account
- Railway account (sign up at railway.app with GitHub)
- Node.js installed locally (v18+)

---

## 📋 STEP 1: Initial Setup (5 minutes)

### 1.1 Create GitHub Repository

```bash
# Go to github.com and create a new repository called "support-staff-dashboard"
# Then clone it locally:

git clone https://github.com/YOUR-USERNAME/support-staff-dashboard.git
cd support-staff-dashboard
```

### 1.2 Copy This Project Structure

Copy all the files from this project into your cloned repository:
- backend/
- frontend/
- database/
- package.json
- README.md

---

## 📋 STEP 2: Backend Setup (10 minutes)

### 2.1 Install Backend Dependencies

```bash
cd backend
npm install
```

### 2.2 Create Environment File

Create `backend/.env` (DO NOT commit this file):

```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/support_dashboard
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 2.3 Test Backend Locally

```bash
# Make sure PostgreSQL is running locally, then:
npm run dev
```

You should see: "Server running on port 5000"

---

## 📋 STEP 3: Frontend Setup (10 minutes)

### 3.1 Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 3.2 Create Environment File

Create `frontend/.env` (DO NOT commit this file):

```env
REACT_APP_API_URL=http://localhost:5000
```

### 3.3 Test Frontend Locally

```bash
npm start
```

Browser should open at http://localhost:3000

---

## 📋 STEP 4: Railway Deployment (15 minutes)

### 4.1 Push to GitHub

```bash
# From project root
git add .
git commit -m "Initial commit - Support Dashboard"
git push origin main
```

### 4.2 Create Railway Project

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `support-staff-dashboard` repository
5. Click **"Deploy Now"**

### 4.3 Add PostgreSQL Database

1. In your Railway project, click **"New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically create and link the database
4. The `DATABASE_URL` environment variable is automatically set

### 4.4 Configure Backend Service

1. Click on your backend service
2. Go to **"Settings"** tab
3. Set these configurations:

**Build Settings:**
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

**Environment Variables:**
Add these (click "New Variable"):
```
JWT_SECRET=your-production-secret-key-make-it-long-and-random
NODE_ENV=production
FRONTEND_URL=https://your-frontend.railway.app
```

### 4.5 Configure Frontend Service

1. Click **"New"** → **"GitHub Repo"** (same repo)
2. This creates a second service for the frontend
3. Go to **"Settings"** tab

**Build Settings:**
- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Start Command: `npx serve -s build -l $PORT`

**Environment Variables:**
```
REACT_APP_API_URL=https://your-backend.railway.app
```

**Note:** Replace `your-backend.railway.app` with the actual backend URL from Railway (found in backend service → "Settings" → "Domains")

### 4.6 Set Up Domains

1. In **Backend Service** → "Settings" → "Networking"
   - Click "Generate Domain"
   - Copy this URL (e.g., `backend-production-abc123.up.railway.app`)

2. In **Frontend Service** → "Settings" → "Networking"
   - Click "Generate Domain"
   - This is your dashboard URL!

3. Update **Frontend Environment Variable**:
   - Go to Frontend Service → Variables
   - Update `REACT_APP_API_URL` with the backend domain from step 1

4. Update **Backend Environment Variable**:
   - Go to Backend Service → Variables
   - Update `FRONTEND_URL` with the frontend domain from step 2

### 4.7 Trigger Redeploy

After updating environment variables:
1. Go to each service
2. Click the three dots (⋮) → "Redeploy"

---

## 📋 STEP 5: Database Initialization (5 minutes)

### 5.1 Run Database Migrations

Railway provides a way to run one-time commands:

1. Go to **PostgreSQL service** in Railway
2. Click **"Connect"** and copy the connection string
3. In your backend service, go to **"Settings"** → **"Deploy"**
4. Add a new deployment trigger or manually SSH

**Or use Railway CLI:**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npm run migrate
```

The `npm run migrate` script will:
- Create all necessary tables
- Set up the schema
- Add indexes

### 5.2 Create Admin User

After migrations, you need to create an admin user:

1. In Railway, go to backend service
2. Find the deployment logs
3. Use the provided SQL or API endpoint to create the first admin

**Option A - Direct SQL (via Railway PostgreSQL console):**

```sql
INSERT INTO users (username, email, password_hash, role) 
VALUES ('admin', 'admin@yourcompany.com', '$2b$10$...', 'admin');
```

**Option B - Use the seed script:**

```bash
railway run npm run seed
```

This creates:
- Admin user: `admin` / `admin123` (CHANGE THIS PASSWORD IMMEDIATELY)

---

## 📋 STEP 6: Import Existing Data (10 minutes)

### 6.1 Export from Google Sheets

1. Open your Google Sheet
2. File → Download → CSV
3. Save as `activity_data.csv`

### 6.2 Upload to Railway

```bash
# From project root
cd database
# Put your CSV file here

railway run node importData.js
```

This will import all your existing activity records.

---

## 📋 STEP 7: Test & Verify (10 minutes)

### 7.1 Access Your Dashboard

Go to your frontend Railway URL: `https://your-frontend.railway.app`

### 7.2 Login

Use the admin credentials created in Step 5.2

### 7.3 Test Features

- ✅ View dashboard metrics
- ✅ Filter by date range
- ✅ Filter by staff member
- ✅ Add new activity record
- ✅ Edit existing record
- ✅ Add a strike to a staff member
- ✅ View strike history
- ✅ Export data to CSV

---

## 🔒 STEP 8: Security Setup (IMPORTANT!)

### 8.1 Change Default Admin Password

1. Login to dashboard
2. Go to Settings → Change Password
3. Set a strong password

### 8.2 Create User Accounts

1. Go to Admin Panel
2. Add users for your team
3. Assign roles (admin, manager, viewer)

### 8.3 Enable CORS Properly

Already configured in backend, but verify:
- Only your frontend domain is allowed
- No wildcards in production

---

## 🎯 Using the Dashboard

### Adding Daily Activity

1. Click **"Add Activity"** button
2. Select staff member
3. Enter metrics for the day
4. Click **"Save"**

### Managing Strikes

1. Go to **"Strikes"** tab
2. Click **"Add Strike"**
3. Fill in the form:
   - Staff Member: Select from dropdown
   - Date: Date of incident
   - Reason: Description
   - Severity: Warning / Minor / Major / Severe
   - Issued By: Your name (auto-filled)
4. Click **"Issue Strike"**

### Viewing Strike History

- Each staff member's profile shows their strike history
- Dashboard shows strike alerts
- Export includes strike data

### Removing Strikes (Admins Only)

1. Go to strike details
2. Click **"Remove Strike"**
3. Enter removal reason
4. Confirm

---

## 📊 Dashboard Features

### Main Dashboard
- Total reports this month
- Quiz acceptance rate
- Active staff count
- Strike alerts

### Charts
- Activity trends over time
- Staff performance comparison
- Senior vs Non-senior metrics
- Strike frequency

### Filters
- Date range picker
- Staff member selector
- Senior status toggle
- Strike status

### Reports
- Export to CSV
- Export to Excel
- Generate PDF report (coming soon)

---

## 🔧 Maintenance & Updates

### Pushing Updates

```bash
git add .
git commit -m "Update description"
git push origin main
```

Railway will automatically deploy your changes!

### Database Backups

Railway automatically backs up your PostgreSQL database.

To manually backup:
1. Go to PostgreSQL service in Railway
2. Settings → Backup
3. Download snapshot

### Viewing Logs

In Railway:
1. Click on a service
2. Go to "Deployments" tab
3. Click on latest deployment
4. View logs

---

## 🆘 Troubleshooting

### Frontend can't connect to backend
- Check CORS settings in backend
- Verify REACT_APP_API_URL is correct
- Check backend is running (Railway deployments tab)

### Database connection errors
- Verify DATABASE_URL in backend service
- Check PostgreSQL service is running
- Run migrations again

### Can't login
- Verify admin user exists: `railway run npm run seed`
- Check JWT_SECRET is set
- Clear browser cookies

### 503 Service Unavailable
- Check Railway service status
- View deployment logs
- Verify build/start commands

---

## 📞 Need Help?

Common issues and solutions are in the `TROUBLESHOOTING.md` file.

For Railway-specific help: https://docs.railway.app

---

## ✨ What's Next?

After successful deployment:

1. **Customize**: Update colors, logo, company name
2. **Integrate**: Connect to Slack/Discord for alerts
3. **Automate**: Set up automated reports
4. **Scale**: Add more features as needed

Your dashboard is live! 🎉
