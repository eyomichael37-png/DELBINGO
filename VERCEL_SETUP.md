# Vercel Deployment Guide

## ⚠️ Important: Socket.IO Limitation

**Vercel uses serverless functions**, which have limitations with **WebSockets/Socket.IO**:
- Serverless functions have execution time limits
- WebSockets need persistent connections
- Vercel Pro ($20/month) supports WebSockets, but it's complex

## 🎯 Recommended Approach: Hybrid Deployment

**Best Solution:**
- ✅ **Client (React)** → Deploy on **Vercel** (FREE, perfect for static sites)
- ✅ **Server (Socket.IO)** → Deploy on **Railway** or **Render** ($5-7/month)

This gives you:
- Free client hosting
- Reliable Socket.IO server
- Best of both worlds!

---

## 🚀 Option 1: Hybrid (Recommended)

### Step 1: Deploy Client on Vercel (Free)

1. **Push code to GitHub** (if not already)
   ```bash
   git add .
   git commit -m "Ready for Vercel"
   git push
   ```

2. **Go to Vercel**
   - Visit https://vercel.com
   - Sign up with **GitHub**

3. **Import Project**
   - Click **"Add New..."** → **"Project"**
   - Select your **WIN BINGO** repository
   - Click **"Import"**

4. **Configure Client**
   - **Framework Preset:** Vite (auto-detected)
   - **Root Directory:** `client`
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

5. **Environment Variables**
   - Click **"Environment Variables"**
   - Add:
     - `VITE_API_URL` = `https://your-server-url.up.railway.app`
     - (You'll get this after deploying the server)

6. **Deploy!**
   - Click **"Deploy"**
   - Wait 1-2 minutes
   - Get your client URL: `https://your-app.vercel.app`

### Step 2: Deploy Server on Railway (or Render)

**See `RAILWAY_SETUP.md` for full instructions**

Quick steps:
1. Go to https://railway.app
2. Deploy from GitHub
3. Set Root Directory: `server`
4. Add `CLIENT_URL` variable with your Vercel URL
5. Get server URL

### Step 3: Update Client Environment Variable

1. Go back to Vercel dashboard
2. Your project → **Settings** → **Environment Variables**
3. Update `VITE_API_URL` with your Railway server URL
4. **Redeploy** (Vercel will auto-redeploy)

---

## 🔧 Option 2: Full Vercel (Advanced - Requires Pro Plan)

**⚠️ Warning:** This requires Vercel Pro ($20/month) for WebSocket support.

### Configuration

Your `vercel.json` is already set up! But you need:

1. **Vercel Pro Plan** ($20/month)
2. **Update server for serverless:**
   - Socket.IO needs special configuration for serverless
   - May need to use polling transport instead of WebSockets

### Steps:

1. **Upgrade to Vercel Pro**
   - Go to Vercel dashboard → Settings → Billing
   - Upgrade to Pro plan

2. **Deploy:**
   - Push code to GitHub
   - Vercel will auto-deploy using `vercel.json`
   - Both client and server deploy together

3. **Environment Variables:**
   - `NODE_ENV=production`
   - `CLIENT_URL` = Your Vercel domain

---

## 📁 Vercel Configuration Files

### Root `vercel.json` (for full deployment)
```json
{
  "builds": [
    {
      "src": "server/src/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/audio/(.*)",
      "dest": "/server/src/index.js"
    },
    {
      "src": "/socket.io/(.*)",
      "dest": "/server/src/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/client/dist/$1"
    }
  ]
}
```

### Client-only deployment (recommended)
- No special config needed
- Vercel auto-detects Vite
- Just set Root Directory to `client`

---

## 🎯 Quick Start (Hybrid - Recommended)

### 1. Deploy Client (5 minutes)
```bash
# 1. Push to GitHub
git add .
git commit -m "Ready for Vercel"
git push

# 2. Go to vercel.com → Import project
# 3. Set Root Directory: client
# 4. Add VITE_API_URL (you'll update this after server deploy)
# 5. Deploy!
```

### 2. Deploy Server (5 minutes)
```bash
# See RAILWAY_SETUP.md
# Or use Render.com
```

### 3. Connect Them
- Update `VITE_API_URL` in Vercel with server URL
- Add `CLIENT_URL` in server with Vercel URL
- Done! ✅

---

## 💰 Pricing Comparison

### Hybrid (Recommended)
- **Client (Vercel):** FREE
- **Server (Railway):** $5/month (or free tier)
- **Total:** $0-5/month

### Full Vercel
- **Vercel Pro:** $20/month
- **Total:** $20/month

---

## 🔄 Auto-Deploy

Both Vercel and Railway auto-deploy on Git push!

1. Make changes
2. `git push`
3. Both platforms rebuild automatically

---

## 🆘 Troubleshooting

### Client Issues
**Build fails:**
- Check Root Directory is `client`
- Verify `package.json` exists in `client/`
- Check build logs in Vercel dashboard

**API not connecting:**
- Verify `VITE_API_URL` is set correctly
- Rebuild after changing env vars
- Check CORS on server

### Server Issues (if using full Vercel)
**Socket.IO not working:**
- Need Vercel Pro for WebSockets
- May need to use polling transport
- Consider hybrid approach instead

---

## ✅ Recommended Setup

**For your BINGO app, I recommend:**

1. ✅ **Client on Vercel** (free, perfect for React)
2. ✅ **Server on Railway** ($5/month, reliable Socket.IO)
3. ✅ **Total cost:** $5/month (or free if Railway free tier works)

This is the most reliable and cost-effective solution!

---

## 📞 Next Steps

1. Choose: Hybrid (recommended) or Full Vercel
2. Follow the steps above
3. Test your deployment
4. Enjoy! 🎉


