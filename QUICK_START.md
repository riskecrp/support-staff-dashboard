# 🚀 QUICK START - Railway Deployment

## Step 1: Push to GitHub (2 minutes)

```bash
# Initialize git and push
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/support-staff-dashboard.git
git push -u origin main
```

## Step 2: Deploy to Railway (5 minutes)

1. Go to **https://railway.app** and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `support-staff-dashboard` repository
4. Railway will create ONE service initially

## Step 3: Add Database (2 minutes)

1. In your Railway project, click **"New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Done! `DATABASE_URL` is automatically set

## Step 4: Split into Two Services (5 minutes)

Railway needs TWO separate services - one for backend, one for frontend.

### Backend Service:
1. Click on your existing service
2. Go to **Settings** → **Root Directory** → Enter: `backend`
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. Go to **Variables** and add:
   ```
   JWT_SECRET=make-this-a-long-random-string-12345
   NODE_ENV=production
   ```
6. Go to **Networking** → **Generate Domain** (save this URL!)

### Frontend Service:
1. Click **"New"** → **"GitHub Repo"** → Select same repo again
2. Go to **Settings** → **Root Directory** → Enter: `frontend`
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npx serve -s build -l $PORT`
5. Go to **Variables** and add:
   ```
   REACT_APP_API_URL=https://YOUR-BACKEND-URL.railway.app
   ```
   (Replace with the backend URL from step 6 above)
6. Go to **Networking** → **Generate Domain**

### Update CORS (Important!):
1. Go back to **Backend Service** → **Variables**
2. Add:
   ```
   FRONTEND_URL=https://YOUR-FRONTEND-URL.railway.app
   ```
   (Replace with frontend URL from Frontend step 6)

## Step 5: Initialize Database (3 minutes)

### Option A: Using Railway CLI (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run --service backend npm run migrate

# Create admin user
railway run --service backend npm run seed
```

### Option B: Manual SQL (if CLI doesn't work)
1. Go to PostgreSQL service in Railway
2. Click **"Connect"** → **"Query"**
3. Copy and paste SQL from `backend/database/migrate.js`
4. Run it
5. Then run SQL from `backend/database/seed.js`

## Step 6: Access Your Dashboard! 🎉

Go to your **frontend Railway URL**: `https://your-frontend.railway.app`

**Default Login:**
- Username: `admin`
- Password: `admin123`

**⚠️ CHANGE PASSWORD IMMEDIATELY!**

---

## Troubleshooting

### Frontend shows blank page:
- Check browser console for errors
- Verify `REACT_APP_API_URL` is set correctly in frontend service
- Make sure it's the BACKEND url, not frontend

### Can't login:
- Check backend logs in Railway
- Verify database migration ran successfully
- Run seed script again: `railway run --service backend npm run seed`

### 503 Error:
- Check both services are deployed (green checkmark)
- View deployment logs for errors
- Verify start commands are correct

---

## What's Next?

1. **Import your data** from Google Sheets (see README.md)
2. **Add staff members** through the Staff page
3. **Issue strikes** through the Strikes page
4. **Change admin password** in settings

Your dashboard is live and ready to use! 🚀
