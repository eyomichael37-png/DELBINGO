# Railway Deployment - Step by Step Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Prepare Your Code
1. Make sure your code is pushed to GitHub
2. If not, run these commands:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

### Step 2: Sign Up for Railway
1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Sign up with **GitHub** (easiest option)
4. Authorize Railway to access your repositories

### Step 3: Deploy Your Server
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your **WIN BINGO** repository
4. Railway will auto-detect Node.js

### Step 4: Configure the Service
1. Click on the service that was created
2. Go to **Settings** tab
3. Set **Root Directory** to: `server`
4. Set **Start Command** to: `npm start` (or leave default)
5. Go to **Variables** tab and add:
   - `NODE_ENV` = `production`
   - `PORT` (Railway sets this automatically, but you can verify)

### Step 5: Get Your Server URL
1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"** (or use custom domain)
3. Copy the URL (e.g., `https://your-app.up.railway.app`)
4. This is your **API URL**!

### Step 6: Update CORS (Important!)
The server needs to allow your client domain. Update `server/src/index.js`:
- Add your Railway domain to the CORS origins
- Or use `*` for development (not recommended for production)

### Step 7: Deploy Your Client (Separate Service)
**Option A: Deploy Client on Railway Too**
1. In the same Railway project, click **"+ New"** → **"GitHub Repo"**
2. Select the same repository
3. Set **Root Directory** to: `client`
4. Set **Build Command** to: `npm install && npm run build`
5. Set **Start Command** to: `npx serve -s dist -l 3000`
6. Add environment variable:
   - `VITE_API_URL` = `https://your-server-url.up.railway.app`

**Option B: Deploy Client on Vercel (Free, Recommended)**
1. Go to https://vercel.com
2. Import your GitHub repo
3. Set **Root Directory** to: `client`
4. Set **Build Command** to: `npm run build`
5. Set **Output Directory** to: `dist`
6. Add environment variable:
   - `VITE_API_URL` = `https://your-server-url.up.railway.app`
7. Deploy!

---

## 🔧 Configuration Files

Railway will use:
- `nixpacks.toml` (if present) - for build configuration
- `package.json` - for Node.js detection
- Auto-detects `server/package.json` when root directory is set

---

## 📝 Environment Variables

**For Server:**
- `NODE_ENV=production` (optional, but recommended)
- `PORT` (auto-set by Railway)

**For Client:**
- `VITE_API_URL=https://your-server-url.up.railway.app`

---

## 🎯 After Deployment

1. **Test your server:**
   - Visit: `https://your-server-url.up.railway.app`
   - Should see: "Go Bingo server running"

2. **Test Socket.IO connection:**
   - Open browser console on your client
   - Should connect without CORS errors

3. **Update CORS in server:**
   - Add your client domain to the CORS origins list in `server/src/index.js`

---

## 🔄 Updating Your App

Railway auto-deploys when you push to GitHub!

1. Make changes locally
2. Commit: `git add . && git commit -m "Update"`
3. Push: `git push`
4. Railway automatically rebuilds and deploys

---

## 💰 Pricing

- **Free tier:** $5 credit/month (usually enough for small apps)
- **Hobby plan:** $5/month (if you exceed free tier)
- **Pro plan:** $20/month (for production apps)

---

## 🆘 Troubleshooting

**Server won't start:**
- Check logs in Railway dashboard
- Verify `Root Directory` is set to `server`
- Check `package.json` has `start` script

**CORS errors:**
- Add your client domain to CORS origins in `server/src/index.js`
- Make sure both domains use HTTPS

**Socket.IO not connecting:**
- Check Railway networking settings
- Verify WebSocket support (Railway supports it!)
- Check browser console for errors

---

## 📞 Need Help?

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway

