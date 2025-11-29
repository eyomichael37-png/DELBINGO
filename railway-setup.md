# Railway Deployment Guide

## Steps:
1. Go to https://railway.app and sign up (free with GitHub)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your WIN BINGO repository
4. Railway will auto-detect Node.js
5. Set environment variables:
   - `PORT` (Railway sets this automatically)
   - `NODE_ENV=production`
6. For the client, deploy separately or use Railway's static file serving

## Alternative: Deploy both server and client
- Server: Deploy `server/` folder as a service
- Client: Build and serve from `client/dist/` or deploy as separate service


