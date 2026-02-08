# Deployment Verification Checklist

## Post-Deployment Tests

### Backend Verification

**Health Check:**
```bash
curl https://[backend-url].up.railway.app/health
# Expected: {"status":"ok","timestamp":"..."}
```

**Session Creation:**
```bash
curl -X POST https://[backend-url].up.railway.app/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"mode":"solo","displayName":"TestUser"}'
  
# Expected: {"session":{...},"user":{...}}
```

**CORS Check:**
```bash
curl -I https://[backend-url].up.railway.app/health
# Check for: Access-Control-Allow-Origin: *
```

---

### Frontend Verification

**Page Load:**
```bash
curl -s https://[frontend-url].up.railway.app | grep "FocusFlow"
# Expected: <title>FocusFlow — AI Focus Coach</title>
```

**Environment Variables:**
- Open browser console on frontend URL
- Check: `process.env.NEXT_PUBLIC_BACKEND_URL`
- Should equal: `https://[backend-url].up.railway.app`

**Network Request:**
- Open frontend in browser
- Open DevTools → Network tab
- Click "Start Focus Session"
- Verify: POST request goes to correct backend URL
- Verify: Request succeeds (status 200/201)

---

### Full User Flow (for Adi)

**Test Steps:**
1. Visit: `https://[frontend-url].up.railway.app`
2. Click "Start Focus Session"
3. Allow camera permission
4. Verify:
   - Focus score ring appears
   - Timer starts counting
   - Camera feed active (hidden)
   - No console errors

**Expected Result:**
- Session creates successfully
- Focus tracking works
- Real-time updates display
- "End Session" button appears

---

### Common Issues

**Frontend can't reach backend:**
- Check `NEXT_PUBLIC_BACKEND_URL` env var
- Verify backend URL is HTTPS (Railway provides this)
- Check CORS headers on backend

**Camera permission denied:**
- Must use HTTPS (Railway auto-provides)
- User must click "Allow"
- Browser security settings

**Session doesn't create:**
- Check backend logs in Railway dashboard
- Verify MongoDB connection (or in-memory fallback working)
- Check for API errors in browser console

---

## Railway URLs to Document

**Backend:**
- URL: `https://focusflow-backend-production-xxxx.up.railway.app`
- Health: `/health`
- API: `/api/sessions`

**Frontend:**
- URL: `https://focusflow-frontend-production-xxxx.up.railway.app`
- Page: Landing page with "Start Focus Session"

**Share with Adi:**
- Frontend URL only (for testing)
- Instructions: Click button, allow camera, verify tracking

---

*Created: 2026-02-07 19:26 CST*
*For: Winston + Clawd deployment*
