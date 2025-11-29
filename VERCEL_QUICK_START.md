# Vercel Quick Start - 5 Minutes

## ⚠️ Important Note

**Vercel has limitations with Socket.IO/WebSockets** because it uses serverless functions.

**Recommended:** Use **hybrid deployment**:
- ✅ Client on Vercel (FREE)
- ✅ Server on Railway/Render ($5/month)

This is the most reliable setup!

---

## 🚀 Option 1: Client Only on Vercel (Recommended)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push
```

### Step 2: Deploy on Vercel

1. **Go to Vercel**
   - Visit https://vercel.com
   - Click **"Sign Up"** → Use **GitHub**

2. **Import Project**
   - Click **"Add New..."** → **"Project"**
   - Select your **WIN BINGO** repository
   - Click **"Import"**

3. **Configure Project**
   - **Framework Preset:** Vite (auto-detected ✅)
   - **Root Directory:** `client` ⚠️ **IMPORTANT!**
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

4. **Environment Variables**
   - Click **"Environment Variables"**
   - Add:
     ```
     Name: VITE_API_URL
     Value: https://your-server-url.up.railway.app
     ```
   - ⚠️ You'll update this after deploying your server!

5. **Deploy!**
   - Click **"Deploy"**
   - Wait 1-2 minutes
   - ✅ Get your URL: `https://your-app.vercel.app`

### Step 3: Deploy Server (Railway/Render)

**For the server, use Railway or Render** (Vercel doesn't handle Socket.IO well):

**Railway (Recommended):**
- See `RAILWAY_SETUP.md`
- Or go to https://railway.app
- Deploy from GitHub
- Set Root Directory: `server`

**Render:**
- Go to https://render.com
- New → Web Service
- Connect GitHub
- Build: `cd server && npm install`
- Start: `cd server && npm start`

### Step 4: Connect Client to Server

1. **Get your server URL** (from Railway/Render)
2. **Update Vercel environment variable:**
   - Vercel Dashboard → Your Project → Settings → Environment Variables
   - Update `VITE_API_URL` with your server URL
   - Click **"Redeploy"** (or it auto-redeploys)

3. **Update server CORS:**
   - Add your Vercel URL to server's CORS origins
   - Or set `CLIENT_URL` environment variable in Railway/Render

---

## 🔧 Option 2: Full Vercel (Advanced)

**⚠️ Requires Vercel Pro ($20/month) for WebSocket support**

If you want to try full Vercel:

1. **Upgrade to Vercel Pro**
   - Dashboard → Settings → Billing → Upgrade

2. **Deploy:**
   - The root `vercel.json` is already configured
   - Just push to GitHub and Vercel will deploy both

3. **Note:** Socket.IO may need special configuration for serverless

---

## 📋 Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Client deployed on Vercel
- [ ] Server deployed on Railway/Render
- [ ] `VITE_API_URL` set in Vercel
- [ ] `CLIENT_URL` set in server
- [ ] Test connection!

---

## 🎯 Recommended Setup

**Best for your BINGO app:**

```
Client (React)  →  Vercel (FREE)
Server (Socket.IO) → Railway ($5/month)
```

**Total cost:** $5/month (or free if Railway free tier works)

---

## 🔄 Auto-Deploy

Vercel automatically deploys when you push to GitHub!

1. Make changes
2. `git push`
3. Vercel rebuilds automatically ✅

---

## 🆘 Troubleshooting

**Build fails:**
- Check Root Directory is `client`
- Verify `package.json` in `client/` folder
- Check build logs in Vercel dashboard

**API not connecting:**
- Verify `VITE_API_URL` is correct
- Rebuild after changing env vars
- Check server CORS settings

**Socket.IO errors:**
- Make sure server is on Railway/Render (not Vercel)
- Check WebSocket support on server platform

---

## ✅ You're Done!

After deployment:
1. Visit your Vercel URL
2. Open browser console
3. Should connect to Socket.IO
4. Countdown should work! 🎉

---

**Need help?** Check Vercel docs: https://vercel.com/docs


