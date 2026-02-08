# Railway Deployment Plan

## Overview
Deploy FocusFlow frontend and backend as **separate Railway services** for Adi to test.

---

## Prerequisites

**Railway CLI installed:**
```bash
npm install -g @railway/cli
railway login
```

**Email for deployment:** rohinagrawal@gmail.com

---

## Deployment Steps

### 1. Backend Deployment

**Project:** hacklahoma-focusflow/backend

**Required Environment Variables:**
```bash
MONGODB_URI=<optional - using in-memory fallback>
GEMINI_API_KEY=AIzaSyBlvloBRCzPKF_B3Jdb3JFbqarm1DktyuU
ELEVENLABS_API_KEY=sk_206795793ca1bb97c8de23e20680ea4d4ccbb13ba6398912
PORT=3001
```

**Deploy Command:**
```bash
cd backend
railway init
railway up
railway domain # Get public URL
```

**Expected Output:**
- Public backend URL: `https://focusflow-backend-production-xxxx.up.railway.app`
- Health check: `GET /health` → `{"status":"ok"}`
- API endpoint: `POST /api/sessions`

---

### 2. Frontend Deployment

**Project:** hacklahoma-focusflow/frontend

**Required Environment Variables:**
```bash
NEXT_PUBLIC_BACKEND_URL=<backend-railway-url-from-step-1>
NEXT_PUBLIC_DEV_MODE=false
```

**Deploy Command:**
```bash
cd frontend
railway init
railway up
railway domain # Get public URL
```

**Expected Output:**
- Public frontend URL: `https://focusflow-frontend-production-xxxx.up.railway.app`
- Page loads with "FocusFlow — AI Focus Coach"
- "Start Focus Session" button visible

---

## Testing Instructions (for Adi)

**1. Visit Frontend URL**
```
https://focusflow-frontend-production-xxxx.up.railway.app
```

**2. Test Flow:**
- Click "Start Focus Session"
- Allow camera permission when prompted
- Verify:
  - Focus score ring appears
  - Timer starts counting
  - Real-time focus tracking works
  - Session ends successfully

**3. Check Backend API (optional):**
```bash
curl https://focusflow-backend-production-xxxx.up.railway.app/health
```

---

## Deployment Checklist

### Backend
- [ ] Railway project created
- [ ] Environment variables set
- [ ] Deployed successfully
- [ ] Health endpoint responding
- [ ] Public domain configured
- [ ] URL shared with frontend

### Frontend
- [ ] Railway project created
- [ ] NEXT_PUBLIC_BACKEND_URL set to backend Railway URL
- [ ] NEXT_PUBLIC_DEV_MODE=false (production mode)
- [ ] Deployed successfully
- [ ] Public domain configured
- [ ] URL shared with Adi

---

## Troubleshooting

**Backend 500 errors:**
- Check Railway logs: `railway logs`
- Verify env vars are set
- Test health endpoint

**Frontend can't connect to backend:**
- Verify NEXT_PUBLIC_BACKEND_URL is correct Railway URL
- Check CORS settings in backend (should allow all origins)
- Inspect browser console for network errors

**Camera permission denied:**
- Browser security settings
- Must use HTTPS (Railway provides this)
- User must click "Allow"

---

## Rollback

If deployment fails:
```bash
railway rollback
```

Or redeploy from local:
```bash
railway up --force
```

---

*Created: 2026-02-07 19:20 CST*
*Owner: Winston + Clawd*
