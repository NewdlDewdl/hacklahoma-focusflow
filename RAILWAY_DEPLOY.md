# Railway Deployment Instructions

## Setup Two Services

### 1. Backend Service

**In Railway Dashboard:**
1. Go to https://railway.com/project/0e30f27b-b439-4c39-a597-05ecc0d46471
2. Click "New Service" → "GitHub Repo"
3. Select `NewdlDewdl/hacklahoma-focusflow`
4. **Root Directory:** `backend`
5. **Build Command:** `npm install`
6. **Start Command:** `node src/index.js`

**Environment Variables:**
```
GEMINI_API_KEY=AIzaSyBlvloBRCzPKF_B3Jdb3JFbqarm1DktyuU
ELEVENLABS_API_KEY=sk_206795793ca1bb97c8de23e20680ea4d4ccbb13ba6398912
MONGODB_URI=
SOLANA_RPC_URL=https://api.devnet.solana.com
PORT=3001
NODE_ENV=production
```

**Port:** 3001

---

### 2. Frontend Service

**In Railway Dashboard:**
1. Click "New Service" → "GitHub Repo"
2. Select `NewdlDewdl/hacklahoma-focusflow`
3. **Root Directory:** `frontend`
4. **Build Command:** `npm install && npm run build`
5. **Start Command:** `npm start`

**Environment Variables:**
```
NEXT_PUBLIC_API_URL=${{backend.RAILWAY_PUBLIC_DOMAIN}}
PORT=3000
NODE_ENV=production
```

**Port:** 3000

---

### 3. Enable Public Domains

**Backend:**
- Settings → Networking → Generate Domain
- Note the URL (e.g., `backend-production-xxxx.up.railway.app`)

**Frontend:**
- Settings → Networking → Generate Domain
- Update frontend env var `NEXT_PUBLIC_API_URL` with backend URL
- Note the URL (e.g., `frontend-production-xxxx.up.railway.app`)

---

## Test Deployment

**Frontend:** https://[frontend-domain].up.railway.app
**Backend Health:** https://[backend-domain].up.railway.app/health
