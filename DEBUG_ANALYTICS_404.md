# Analytics 404 Debug Session

## Problem
`/api/analytics/dashboard` returns 404 on production Railway but works locally.

## What We Know

### ✅ Working Locally
```bash
curl http://localhost:3001/api/analytics/dashboard
# Returns: {"totalSessions": ..., "avgFocusScore": ...}
```

### ❌ Failing on Production
```bash
curl https://backend-production-3aaf.up.railway.app/api/analytics/dashboard
# Returns: 404 "Cannot GET /api/analytics/dashboard"
```

### ✅ Other Endpoints Work
- `/health` - ✅ 200 OK
- `/api/sessions` - ✅ 200 OK (creates sessions)
- `/api/analyze` - ✅ Likely working (need to test)

## Hypothesis 1: Stale Railway Build Cache

**Evidence:**
- Commit `0767605` included 1600+ garbage files (macOS system containers, .bun cache, etc.)
- Railway might have cached an older build before analytics.js was added
- Analytics was added in commit `353b15c`

**Test:**
Check which commit Railway is actually building from in the logs.

## Hypothesis 2: File Missing from Deployment

**Evidence:**
- `.railwayignore` exists but doesn't exclude `src/routes/analytics.js` ✅
- File exists locally at `backend/src/routes/analytics.js` ✅
- Route registered in `backend/src/index.js` line 46 ✅

**Test:**
SSH into Railway container and verify file exists.

## Hypothesis 3: Route Registration Order

**Evidence:**
Looking at `backend/src/index.js`:
```javascript
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/users', require('./routes/users'));
app.use('/api/analyze', require('./routes/analyze'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/analytics', require('./routes/analytics')); // Line 46
```

Analytics route is registered AFTER other routes. Could there be a conflicting route?

**Test:**
Check if `/api/analyze` or another route is catching `/api/analytics/*` requests.

## Hypothesis 4: Module Require Error

**Evidence:**
If `require('./routes/analytics')` throws an error during startup, Express won't register the route but might continue serving other routes.

**Test:**
Check Railway backend logs for startup errors.

## Hypothesis 5: MongoDB Dependency

**Evidence:**
Analytics routes use heavy MongoDB aggregation pipelines. If MongoDB connection fails during route registration, the route might fail to load.

**Test:**
Check if analytics route requires MongoDB to be connected before it can be registered.

## Investigation Steps

### Step 1: Check Railway Build Logs
Look for:
- Which commit is being built
- Any errors during `npm install`
- Any errors during startup
- File copy operations (is analytics.js being copied?)

### Step 2: Check Railway Runtime Logs
Look for:
- "✅ MongoDB connected" message
- Any errors when requiring analytics.js
- Express route registration messages

### Step 3: Test Other MongoDB-Heavy Endpoints
Try hitting endpoints that use MongoDB to see if it's a MongoDB connection issue:
- POST /api/sessions (already working ✅)
- GET /api/users/:id
- GET /api/rooms

### Step 4: Force Clean Build
- Clear Railway build cache
- Trigger fresh deploy
- Monitor build logs in real-time

### Step 5: Simplify Analytics Route (Debug Version)
Create a minimal test endpoint that doesn't rely on MongoDB:
```javascript
router.get('/test', (req, res) => {
  res.json({ message: 'Analytics route is registered' });
});
```

If `/api/analytics/test` works but `/api/analytics/dashboard` doesn't, it's a MongoDB issue.

## Next Steps for Tom & Clawd

**Tom:**
1. Check Railway backend build logs at: https://railway.com/project/0e30f27b-b439-4c39-a597-05ecc0d46471/service/883506e5-841e-4493-a277-66c08fbc2e07?id=7b718827-0720-487b-b926-68c473589939
2. Look for any errors during startup
3. Verify which commit is being built
4. Check if MongoDB connection succeeds before analytics route registration

**Clawd:**
1. Add a simple test endpoint to analytics.js that doesn't use MongoDB
2. Commit and push
3. Trigger Railway redeploy
4. Test if `/api/analytics/test` works

**Together:**
- If test endpoint works → MongoDB aggregation pipeline issue
- If test endpoint fails → Route registration issue
- Debug based on findings

## Commit History
- `353b15c` - MongoDB analytics pipelines + change streams (Tom's commit)
- `0767605` - Fix MongoDB password (Clawd's commit with 1600+ garbage files)
- `3d5f69a` - Focus tracking fix (Tom's commit)

**Current Railway deploy ID:** 7b718827-0720-487b-b926-68c473589939
