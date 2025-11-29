# Deployment Guide - BINGO App

## 🚀 Quick Options (Free/Cheap)

### 1. Railway (Recommended - Best for Socket.IO)
**Free tier available, $5/month for production**

**Steps:**
1. Sign up at https://railway.app (GitHub login)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects Node.js
5. Set root directory: `server`
6. Add environment variable: `NODE_ENV=production`
7. Deploy!

**For client:**
- Option A: Deploy separately on Railway as static site
- Option B: Use Vercel/Netlify (free) for client, Railway for server

---

### 2. Render
**Free tier (limited), $7/month for WebSocket support**

**Steps:**
1. Sign up at https://render.com
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Environment: Node
5. Deploy!

**Note:** Free tier has WebSocket limitations. Paid tier ($7/month) recommended.

---

### 3. Fly.io
**Free tier with generous limits**

**Steps:**
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Sign up: `fly auth signup`
3. Deploy: `fly launch` (in project root)
4. Follow prompts, use `fly.toml` config

---

### 4. Vercel (Client) + Railway/Render (Server)
**Free for client, server needs separate hosting**

**Why:** Vercel has WebSocket limitations, but great for static React apps.

**Steps:**
1. **Client on Vercel:**
   - Push to GitHub
   - Import project on Vercel
   - Root directory: `client`
   - Build command: `npm run build`
   - Output directory: `dist`

2. **Server on Railway/Render:**
   - Deploy server separately
   - Update client's `VITE_API_URL` to server URL

---

### 5. DigitalOcean App Platform
**$5/month, very reliable**

**Steps:**
1. Sign up at https://digitalocean.com
2. Create App → GitHub
3. Select repo
4. Configure:
   - Type: Web Service
   - Source: `server/`
   - Build command: `npm install`
   - Run command: `npm start`
5. Deploy!

---

### 6. Docker + Any VPS
**Most flexible, ~$5-10/month**

**Providers:** DigitalOcean Droplet, Linode, Vultr, Hetzner

**Steps:**
1. Create VPS (Ubuntu 22.04)
2. SSH into server
3. Install Docker: `curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh`
4. Clone repo: `git clone <your-repo>`
5. Build: `docker build -t bingo-app .`
6. Run: `docker run -d -p 80:3001 --name bingo bingo-app`

---

## 📋 Environment Variables Needed

For all deployments, set:
- `NODE_ENV=production`
- `PORT` (usually auto-set by platform)
- `VITE_API_URL` (for client build) - your server URL

---

## 🔧 Quick Setup Commands

### Railway (after connecting repo):
```bash
# Railway CLI (optional)
npm i -g @railway/cli
railway login
railway link
railway up
```

### Render:
Just use the web dashboard - no CLI needed!

### Fly.io:
```bash
fly launch
fly deploy
```

---

## 💡 Recommendation

**Best combo for free:**
- **Server:** Railway (free tier, great WebSocket support)
- **Client:** Vercel or Netlify (free, perfect for React)

**Best for production:**
- **Both on Railway** ($5/month) or **DigitalOcean App Platform** ($5/month)

---

## 🎯 Current Setup Fix

If you want to keep using your current host but fix the issue:
1. Make sure server is running: `cd server && npm start`
2. Build client: `cd client && VITE_API_URL=https://api.friendstech7.com npm run build`
3. Copy to public_html: `cp -r client/dist/* public_html/`


