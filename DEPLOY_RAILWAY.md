# Deployment Guide: Railway

This guide covers deploying both the backend (Express + MongoDB) and frontend (Expo web) to Railway.

## Prerequisites

1. GitHub account (push your repo there)
2. Railway account (https://railway.app)
3. MongoDB Atlas account (https://www.mongodb.com/cloud/atlas) — free tier available

---

## Step 1: Set up MongoDB Atlas (Free Tier)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up and create a free account
3. Click "Create a Deployment" → choose "M0 (Free)" tier
4. Configure:
   - Cloud Provider: AWS, Region: closest to you
   - Database name: `weightloss`
   - Click "Create"
5. Once created, click "Connect" → "Drivers" → copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/weightloss?retryWrites=true&w=majority
   ```
   mongodb+srv://gadesaichand_db_user:MY0erwFl2bEy85tB@weightloss.ydfqhks.mongodb.net/?appName=weightloss
   `````
6. Replace `<username>` and `<password>` with credentials you create in the "Database Access" tab
7. **Save this connection string** — you'll need it for Railway env vars

---

## Step 2: Push Your Repository to GitHub

1. Initialize git (if not already):
   ```bash
   cd d:\weightloss-frontend
   git init
   git add .
   git commit -m "Initial commit: Expo app + Express backend"
   ```

2. Create a new repository on GitHub (https://github.com/new)
   - Name: `weightloss-frontend`
   - Make it public or private (your choice)
   - Do NOT initialize with README

3. Connect your local repo to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/weightloss-frontend.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 3: Deploy Backend to Railway

### 3a. Connect GitHub to Railway

1. Go to https://railway.app and sign in
2. Click "New Project" → "Deploy from GitHub"
3. Authorize Railway to access your GitHub account
4. Select `weightloss-frontend` repository
5. Railway will auto-detect the project structure

### 3b. Configure Backend Service

1. In the Railway project dashboard, click "Add Service" or wait for auto-detection
2. If prompted, select `backend` as the service root directory
3. Go to the backend service settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Port:** `4000` (will be auto-assigned)

### 3c. Add Environment Variables

1. In the backend service, go to **Variables** tab
2. Add these variables:
   ```
   MONGO_URI = mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/weightloss?retryWrites=true&w=majority
   JWT_SECRET = your-super-secret-key-here-change-this
   PORT = ${{PORT}}
   ```
   (Railway auto-assigns `${{PORT}}` — keep this)

3. Click "Deploy" — Railway will build and deploy automatically
4. Once deployed, Railway will show a public URL like: `https://weightloss-backend-prod.railway.app`
5. **Save this URL** — you'll use it in the frontend

---

## Step 4: Deploy Frontend to Railway (Web)

### 4a. Add a Second Service (Frontend)

1. Back in the Railway project, click "Add Service"
2. Select "GitHub" and choose the same `weightloss-frontend` repo
3. Set root directory to root (for Expo web):
   - **Build Command:** `npm install && npx expo export --platform web`
   - **Start Command:** `npm run web` (or use a static host)
   - **Port:** `3000`

### 4b. Add Environment Variables to Frontend

1. In the frontend service, go to **Variables** tab
2. Add:
   ```
   EXPO_PUBLIC_BACKEND_URL = https://weightloss-backend-prod.railway.app
   PORT = ${{PORT}}
   ```
   (Use the backend URL from Step 3d)

3. Click "Deploy"

---

## Step 5: Verify Deployment

1. Go to your Railway project dashboard
2. Both services should show "✓ Deployment Successful"
3. Click the frontend service URL to open the app in a browser
4. Try signing up / logging in — it should use the backend API (MongoDB)

---

## Troubleshooting

### Backend won't start
- Check "Deployments" tab for build logs
- Verify `MONGO_URI` is correct (no typos, IP whitelist in Atlas if needed)
- Ensure `JWT_SECRET` is set

### Frontend can't reach backend
- Check that `EXPO_PUBLIC_BACKEND_URL` is set correctly
- Test in browser console: `fetch('https://your-backend-url/').then(r => r.json())`
- Verify CORS is configured in backend (`cors` package is imported in `index.js`)

### MongoDB connection fails
- In Atlas, go to "Network Access" and add `0.0.0.0/0` to allow all IPs (for development)
- Or whitelist Railway's IP range (check Railway docs)

---

## Local Development (Before Deploying)

### Backend
```bash
cd backend
npm install
# Create .env with MONGO_URI and JWT_SECRET
npm run dev
```

### Frontend
```bash
npm install
EXPO_PUBLIC_BACKEND_URL=http://localhost:4000 npx expo start --web
```

---

## Next Steps

1. Configure custom domain (Railway allows connecting your own domain)
2. Set up automatic deploys on git push (Railway does this by default)
3. Add monitoring and logs (Railway dashboard shows logs in real-time)
4. Consider adding a staging environment (create a second Railway project)

---

## Quick Commands

```bash
# Push changes to trigger auto-deploy
git add .
git commit -m "Update feature"
git push

# View logs in Railway
# — Use Railway dashboard or CLI: railway logs

# Rollback to previous deployment
# — Use Railway dashboard: Deployments tab
```

For more help, visit:
- Railway docs: https://docs.railway.app
- MongoDB Atlas docs: https://docs.atlas.mongodb.com
