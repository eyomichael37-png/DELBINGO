# Server Deployment Guide - Step by Step

## 🎯 Goal
Deploy your Socket.IO server so your Vercel client can connect to it.

## ⚠️ Important
- **Client:** Already deployed on Vercel ✅
- **Server:** Needs separate hosting (Railway/Render) for Socket.IO support

---

## 🚀 Option 1: Railway (Recommended - $5/month or free tier)

### Step 1: Sign Up for Railway
1. Go to **https://railway.app**
2. Click **"Start a New Project"**
3. Sign up with **GitHub** (same account as your Vercel project)
4. Authorize Railway to access your repositories

### Step 2: Deploy Your Server
1. Click **"New Project"** → **"Deploy from GitHub repo"**
2. Select your **DELBINGO** repository
3. Railway will auto-detect Node.js ✅

### Step 3: Configure the Service
1. Click on the service that was created (it will have a random name)
2. Go to **Settings** tab
3. Set **Root Directory** to: `server`
4. **Start Command** should be: `npm start` (auto-detected)
5. Go to **Variables** tab → Add:
   - `NODE_ENV` = `production`
   - `CLIENT_URL` = `https://your-vercel-app.vercel.app` (your Vercel client URL)

### Step 4: Get Your Server URL
1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `https://bingo-server-production.up.railway.app`)
4. **This is your API URL!** 📋

### Step 5: Update Vercel Client Environment Variable
1. Go back to **Vercel Dashboard**
2. Select your client project
3. Go to **Settings** → **Environment Variables**
4. Find or add `VITE_API_URL`
5. Set value to your Railway server URL: `https://your-server.up.railway.app`
6. **Redeploy** the client (or it will auto-redeploy)

### Step 6: Update Server CORS (if needed)
The server already has dynamic CORS setup, but verify:
- `CLIENT_URL` environment variable is set in Railway
- Server will automatically allow your Vercel domain

---

## 🔧 Option 2: Render (Alternative - $7/month for WebSocket support)

### Step 1: Sign Up for Render
1. Go to **https://render.com**
2. Sign up with **GitHub**

### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your **DELBINGO** repository

### Step 3: Configure
- **Name:** `bingo-server` (or any name)
- **Region:** Choose closest to your users
- **Branch:** `main`
- **Root Directory:** `server`
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### Step 4: Environment Variables
Add:
- `NODE_ENV` = `production`
- `CLIENT_URL` = `https://your-vercel-app.vercel.app`

### Step 5: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (2-3 minutes)
3. Get your URL: `https://your-app.onrender.com`

### Step 6: Update Vercel
- Same as Railway Step 5 above
- Set `VITE_API_URL` to your Render URL

---

## 📋 Quick Checklist

### Before Deployment:
- [ ] Code is pushed to GitHub (server folder included)
- [ ] Railway/Render account created
- [ ] Ready to deploy

### During Deployment:
- [ ] Server deployed on Railway/Render
- [ ] Server URL obtained
- [ ] `CLIENT_URL` set in server environment variables
- [ ] `VITE_API_URL` updated in Vercel

### After Deployment:
- [ ] Test server: Visit server URL → Should see "Go Bingo server running"
- [ ] Test client: Visit Vercel URL → Should connect to Socket.IO
- [ ] Check browser console for connection errors
- [ ] Verify countdown/player count updates

---

## 🎯 Step-by-Step: Railway Deployment (Detailed)

### 1. Initial Setup (5 minutes)
```
1. Go to railway.app
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose DELBINGO repository
```

### 2. Configure Service (2 minutes)
```
1. Click on the service
2. Settings → Root Directory: "server"
3. Settings → Variables:
   - NODE_ENV = production
   - CLIENT_URL = https://your-app.vercel.app
```

### 3. Get Server URL (1 minute)
```
1. Settings → Networking
2. Click "Generate Domain"
3. Copy the URL
```

### 4. Update Client (2 minutes)
```
1. Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Update VITE_API_URL = https://your-server.up.railway.app
4. Redeploy (or auto-redeploys)
```

### 5. Test (2 minutes)
```
1. Visit your Vercel URL
2. Open browser console (F12)
3. Should see Socket.IO connection
4. Countdown should work!
```

**Total time: ~12 minutes**

---

## 🔍 Troubleshooting

### Server won't start:
- Check Railway/Render logs
- Verify Root Directory is `server`
- Check `package.json` has `start` script

### CORS errors:
- Verify `CLIENT_URL` is set in server
- Make sure both URLs use HTTPS
- Check server logs for CORS errors

### Socket.IO not connecting:
- Check browser console for errors
- Verify `VITE_API_URL` is correct in Vercel
- Check server is running (visit server URL)
- Verify WebSocket support (Railway/Render both support it)

### Client shows wrong API URL:
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check Vercel environment variables are set correctly

---

## 💰 Pricing

### Railway:
- **Free tier:** $5 credit/month (usually enough!)
- **Hobby:** $5/month if you exceed free tier

### Render:
- **Free tier:** Limited WebSocket support
- **Starter:** $7/month (full WebSocket support)

**Recommendation:** Start with Railway free tier

---

## ✅ Success Indicators

After deployment, you should see:
1. ✅ Server URL shows "Go Bingo server running"
2. ✅ Client connects to Socket.IO (check browser console)
3. ✅ Countdown timer updates in real-time
4. ✅ Player count updates
5. ✅ No CORS errors in console

---

## 🎉 Next Steps After Deployment

1. **Test the full flow:**
   - Open client in multiple browser tabs
   - Verify real-time updates work
   - Test game functionality

2. **Set up custom domains (optional):**
   - Railway: Add custom domain in Networking settings
   - Update `VITE_API_URL` if you change server domain

3. **Monitor:**
   - Check Railway/Render logs for errors
   - Monitor Vercel analytics for client performance

---

## 📞 Need Help?

- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Check deployment logs in both platforms

**Ready to deploy? Start with Railway Step 1 above!** 🚀

