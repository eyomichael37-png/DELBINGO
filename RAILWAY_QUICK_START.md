# Railway Quick Start - 5 Minutes

## ✅ Pre-Deployment Checklist

- [ ] Code is pushed to GitHub
- [ ] You have a GitHub account
- [ ] You're ready to sign up for Railway (free tier available)

---

## 🚀 Deployment Steps

### 1. Sign Up & Connect GitHub
1. Go to **https://railway.app**
2. Click **"Start a New Project"**
3. Sign up with **GitHub** (click "Login with GitHub")
4. Authorize Railway access

### 2. Deploy Server
1. Click **"New Project"** → **"Deploy from GitHub repo"**
2. Select your **WIN BINGO** repository
3. Railway auto-detects Node.js ✅

### 3. Configure Server
1. Click on the service (it will have a random name)
2. Go to **Settings** tab
3. Set **Root Directory**: `server`
4. **Start Command** should be: `npm start` (auto-detected)
5. Go to **Variables** tab → Add:
   - `NODE_ENV` = `production`
   - `CLIENT_URL` = (you'll add this after deploying client)

### 4. Get Server URL
1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `https://bingo-server-production.up.railway.app`)
4. **This is your API URL!** 📋

### 5. Deploy Client (Choose One)

#### Option A: Railway (Same Project)
1. In Railway project, click **"+ New"** → **"GitHub Repo"**
2. Select same repository
3. **Settings**:
   - Root Directory: `client`
   - Build Command: `npm install && npm run build`
   - Start Command: `npx serve -s dist -l $PORT`
4. **Variables**:
   - `VITE_API_URL` = `https://your-server-url.up.railway.app`
5. Generate domain for client

#### Option B: Vercel (Recommended - Free)
1. Go to **https://vercel.com**
2. **Import Project** → Select your GitHub repo
3. **Configure**:
   - Framework Preset: Vite
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Environment Variables**:
   - `VITE_API_URL` = `https://your-server-url.up.railway.app`
5. Deploy!

### 6. Update CORS
1. Go back to Railway server service
2. **Variables** tab → Add:
   - `CLIENT_URL` = `https://your-client-url.vercel.app` (or Railway URL)
3. Railway will auto-redeploy

---

## 🎯 Test Your Deployment

1. **Server Test:**
   - Visit: `https://your-server-url.up.railway.app`
   - Should see: "Go Bingo server running"

2. **Client Test:**
   - Visit your client URL
   - Open browser console (F12)
   - Should connect to Socket.IO without errors
   - Countdown and player count should update!

---

## 📁 File Structure Railway Uses

```
WIN BINGO/
├── server/          ← Railway uses this as root
│   ├── src/
│   │   └── index.js
│   ├── package.json
│   └── ...
├── client/          ← Deploy separately
├── audio/           ← Needs to be accessible
└── railway.json     ← Railway config (optional)
```

---

## 🔧 Important Notes

### Audio Files
The server looks for audio files in:
- `server/audio/` (first priority)
- `../../audio/` (fallback)

**For Railway:** Make sure audio files are in the `server/` directory or update the path in `index.js`.

### Environment Variables
- `PORT` - Auto-set by Railway (don't set manually)
- `NODE_ENV` - Set to `production`
- `CLIENT_URL` - Your client domain (for CORS)

### Auto-Deploy
Railway automatically deploys when you push to GitHub! Just:
```bash
git add .
git commit -m "Update"
git push
```

---

## 💰 Pricing

- **Free Tier:** $5 credit/month (usually enough!)
- **Hobby:** $5/month if you exceed free tier
- **Pro:** $20/month for production

---

## 🆘 Common Issues

**"Cannot find module"**
- Check Root Directory is set to `server`
- Verify `package.json` exists in `server/`

**"Port already in use"**
- Railway sets PORT automatically, don't override it

**CORS errors**
- Add `CLIENT_URL` variable to Railway
- Make sure both URLs use HTTPS

**Audio files not loading**
- Check audio directory path
- Verify files are in the repo

---

## 📞 Next Steps

1. ✅ Deploy server on Railway
2. ✅ Deploy client on Vercel/Railway
3. ✅ Test connection
4. ✅ Update CORS with client URL
5. 🎉 Done!

---

**Need help?** Check Railway logs in the dashboard or Railway Discord!

