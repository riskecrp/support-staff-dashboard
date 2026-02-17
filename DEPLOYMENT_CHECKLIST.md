# 📋 DEPLOYMENT CHECKLIST

Print this out or keep it open while deploying!

## ☐ BEFORE YOU START

- [ ] Create GitHub account (if you don't have one)
- [ ] Create Railway account at railway.app
- [ ] Have your Google Sheets data ready to export

---

## ☐ STEP 1: GitHub Setup (5 min)

- [ ] Create new repository called "support-staff-dashboard"
- [ ] Clone the repository locally
- [ ] Copy all project files into the cloned folder
- [ ] Run: `git add .`
- [ ] Run: `git commit -m "Initial commit"`
- [ ] Run: `git push origin main`

---

## ☐ STEP 2: Railway Project (3 min)

- [ ] Login to railway.app
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Choose your support-staff-dashboard repo
- [ ] Wait for initial deployment

---

## ☐ STEP 3: Add PostgreSQL (2 min)

- [ ] Click "New" in your Railway project
- [ ] Select "Database" → "PostgreSQL"
- [ ] Wait for database to provision
- [ ] Verify DATABASE_URL appears in backend service

---

## ☐ STEP 4: Configure Backend Service (5 min)

- [ ] Click on the service Railway created
- [ ] Go to Settings tab
- [ ] Set Root Directory: `backend`
- [ ] Set Build Command: `npm install`
- [ ] Set Start Command: `npm start`
- [ ] Go to Variables tab
- [ ] Add variable: `JWT_SECRET` = (any long random string)
- [ ] Add variable: `NODE_ENV` = `production`
- [ ] Go to Networking
- [ ] Click "Generate Domain"
- [ ] **SAVE THIS URL** - you'll need it!

---

## ☐ STEP 5: Add Frontend Service (5 min)

- [ ] Click "New" → "GitHub Repo"
- [ ] Select same repository again
- [ ] Go to Settings tab
- [ ] Set Root Directory: `frontend`
- [ ] Set Build Command: `npm install && npm run build`
- [ ] Set Start Command: `npx serve -s build -l $PORT`
- [ ] Go to Variables tab
- [ ] Add variable: `REACT_APP_API_URL` = (backend URL from Step 4)
- [ ] Go to Networking
- [ ] Click "Generate Domain"
- [ ] **SAVE THIS URL** - this is your dashboard!

---

## ☐ STEP 6: Update Backend CORS (2 min)

- [ ] Go back to backend service
- [ ] Go to Variables tab
- [ ] Add variable: `FRONTEND_URL` = (frontend URL from Step 5)
- [ ] Click three dots → "Redeploy"

---

## ☐ STEP 7: Initialize Database (5 min)

### Method A - Railway CLI (Recommended):
- [ ] Install: `npm install -g @railway/cli`
- [ ] Run: `railway login`
- [ ] Run: `railway link` (select your project)
- [ ] Run: `railway run --service backend npm run migrate`
- [ ] Run: `railway run --service backend npm run seed`

### Method B - Manual (if CLI fails):
- [ ] Go to PostgreSQL service in Railway
- [ ] Click "Connect" → "Query"
- [ ] Copy SQL from backend/database/migrate.js
- [ ] Paste and run
- [ ] Copy SQL from backend/database/seed.js  
- [ ] Paste and run

---

## ☐ STEP 8: Test Your Dashboard (5 min)

- [ ] Go to your frontend URL
- [ ] Login with username: `admin`, password: `admin123`
- [ ] Dashboard loads successfully
- [ ] Navigate to Strikes page
- [ ] Navigate to Staff page
- [ ] Navigate to Activity page

---

## ☐ STEP 9: Security Setup (5 min)

- [ ] Click your profile in dashboard
- [ ] Change admin password
- [ ] Use a strong password (12+ characters)
- [ ] Write it down somewhere safe!

---

## ☐ STEP 10: Import Your Data (10 min)

- [ ] Export your Google Sheet as CSV
- [ ] Install Railway CLI (if not already)
- [ ] Put CSV file in database/ folder
- [ ] Run: `cd database && npm install`
- [ ] Run: `railway run --service backend node importCSV.js activity_data.csv`
- [ ] Verify data appears in dashboard

---

## ☐ STEP 11: Test Strike Management (5 min)

- [ ] Go to Strikes page
- [ ] Click "Issue Strike"
- [ ] Fill out the form
- [ ] Submit strike
- [ ] Verify it appears in the list
- [ ] Test removing a strike

---

## ✅ DEPLOYMENT COMPLETE!

Your dashboard is live at: `https://your-frontend.railway.app`

## Quick Reference:

**Frontend URL**: ___________________________
**Backend URL**: ___________________________
**Admin Username**: admin
**Admin Password**: ___________________________

---

## Need Help?

Common issues:
- **Blank page**: Check REACT_APP_API_URL in frontend variables
- **Can't login**: Re-run seed script
- **503 error**: Check deployment logs
- **CORS error**: Verify FRONTEND_URL in backend variables

See README.md for detailed troubleshooting!
