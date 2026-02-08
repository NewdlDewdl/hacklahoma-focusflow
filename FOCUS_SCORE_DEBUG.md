# Focus Score Not Updating - Debug Analysis

**Issue:** Focus score isn't updating when user looks away

## Root Cause Analysis

### Issue #1: Detection Loop Too Slow
**File:** `frontend/app/page.tsx` line 172

```javascript
const interval = setInterval(detectLoop, 5000); // Every 5 seconds ❌
```

**Problem:** Detection only runs every 5 seconds. Users look away for 4 seconds and nothing updates.

**Proposed Fix:**
```javascript
const interval = setInterval(detectLoop, 1000); // Every 1 second ✅
```

**Debate Point:**
- **500ms option:** Near real-time, better UX, but more CPU/battery usage
- **1000ms option:** Good balance, smooth enough for focus tracking
- **Current 5000ms:** Way too slow, feels broken

**My recommendation:** Start with 1000ms. Measure. Optimize to 500ms if needed.

---

### Issue #2: Backend Endpoint Analysis

**File:** `backend/src/routes/analyze.js`

The `/api/analyze` endpoint looks correct:

1. ✅ Validates input with Zod schema
2. ✅ Saves Reading to MongoDB (or in-memory fallback)
3. ✅ Emits `focus:update` via Socket.IO to correct channel
4. ✅ Triggers nudges when `focusScore < 50` (30s cooldown)

**Socket.IO channel logic:**
```javascript
const channel = session.roomId ? session.roomId : `session:${sessionId}`;
io.to(channel).emit('focus:update', { ... });
```

This should work. But need to verify:
- Is Socket.IO actually connecting?
- Is the frontend listening on the right channel?

---

### Issue #3: Frontend Socket Listener

**File:** `frontend/hooks/useSocket.ts`

```javascript
const onFocusUpdate = useCallback((callback: (data: FocusUpdate) => void) => {
  socketRef.current?.on('focus:update', callback);
}, []);
```

**Potential Bug:** This registers a new listener every time `onFocusUpdate` is called.

**File:** `frontend/app/page.tsx` lines 102-115

```javascript
useEffect(() => {
  onFocusUpdate((data) => {
    setFocusScore(data.focusScore);
    if (data.attentionState === 'distracted') {
      setDistractionCount(prev => prev + 1);
    }

    setFocusHistory(prev => [
      ...prev,
      {
        time: formatTime(sessionTime),
        score: data.focusScore,
      }
    ]);
  });
}, [onFocusUpdate, onNudge]);
```

**Problem:** `onFocusUpdate` is called in a `useEffect` without cleanup. This might register multiple listeners.

**Proposed Fix:**
```javascript
useEffect(() => {
  const handleUpdate = (data) => {
    setFocusScore(data.focusScore);
    if (data.attentionState === 'distracted') {
      setDistractionCount(prev => prev + 1);
    }

    setFocusHistory(prev => [
      ...prev,
      {
        time: formatTime(sessionTime),
        score: data.focusScore,
      }
    ]);
  };

  onFocusUpdate(handleUpdate);

  // Cleanup listener on unmount
  return () => {
    socket?.off('focus:update', handleUpdate);
  };
}, [onFocusUpdate, onNudge, socket]);
```

---

### Issue #4: Human.js Detection

**File:** `frontend/app/page.tsx` lines 136-175

The detection loop looks correct:
1. ✅ Detects face with Human.js
2. ✅ Calculates focus score from yaw/pitch rotation
3. ✅ Calls `sendFocusUpdate()` to backend
4. ✅ Broadcasts to room if in multiplayer

**But:** This only runs every 5 seconds (see Issue #1).

---

## Verification Checklist

Before we fix anything, let's verify:

1. **Socket.IO Connection:**
   - Open browser console on deployed frontend
   - Look for `🔌 Socket connected: <id>`
   - If missing → Socket.IO not connecting

2. **Backend Logs:**
   - Check backend logs for `/api/analyze` POST requests
   - Should see incoming focus updates when user starts session
   - If missing → Frontend not calling backend

3. **Network Tab:**
   - Check browser Network tab for WebSocket connection
   - Should see `ws://` or `wss://` connection to backend
   - If missing → Socket.IO transport issue

---

## Implementation Plan

### Step 1: Fix Detection Interval (Quick Win)

**File:** `frontend/app/page.tsx` line 172

```diff
-    const interval = setInterval(detectLoop, 5000); // Every 5 seconds
+    const interval = setInterval(detectLoop, 1000); // Every 1 second
```

**Expected Result:** Score updates every 1 second instead of every 5 seconds.

---

### Step 2: Fix Socket Listener Cleanup

**File:** `frontend/app/page.tsx` lines 102-115

Add cleanup to prevent listener duplication:

```javascript
useEffect(() => {
  const handleUpdate = (data) => {
    setFocusScore(data.focusScore);
    if (data.attentionState === 'distracted') {
      setDistractionCount(prev => prev + 1);
    }

    setFocusHistory(prev => [
      ...prev,
      {
        time: formatTime(sessionTime),
        score: data.focusScore,
      }
    ]);
  };

  onFocusUpdate(handleUpdate);

  return () => {
    if (socket) {
      socket.off('focus:update', handleUpdate);
    }
  };
}, [onFocusUpdate, socket, sessionTime]);
```

---

### Step 3: Add Debug Logging

**File:** `frontend/app/page.tsx` in detectLoop function

Add logging to verify detection is working:

```javascript
const detectLoop = async () => {
  try {
    const result = await humanRef.current.detect(videoRef.current);

    if (result.face && result.face.length > 0) {
      const face = result.face[0];
      const rotation = face.rotation?.angle || { yaw: 0, pitch: 0, roll: 0 };

      const score = calculateFocusScore(rotation.yaw, rotation.pitch);
      const state = getAttentionState(score);

      console.log('👁️ Detection:', { score, state, rotation }); // ADD THIS

      // Send to backend
      await sendFocusUpdate(score, state, {
        yaw: rotation.yaw,
        pitch: rotation.pitch,
        roll: rotation.roll
      });

      // ... rest of code
    } else {
      console.log('⚠️ No face detected'); // ADD THIS
    }
  } catch (err) {
    console.error('Human.js detection error:', err);
  }
};
```

---

### Step 4: Verify Backend is Receiving Updates

**File:** `backend/src/routes/analyze.js` line 47

Add logging:

```javascript
router.post('/', async (req, res) => {
  try {
    const { sessionId, focusScore, attentionState, distractionType: inputDistraction, metadata } = analyzeSchema.parse(req.body);
    
    console.log(`📊 Analyze: session=${sessionId} score=${focusScore} state=${attentionState}`); // ADD THIS
    
    // ... rest of code
  } catch (error) {
    // ... error handling
  }
});
```

---

## Debate Questions for Tom

1. **Detection interval:** 500ms vs 1000ms vs 5000ms?
   - I say 1000ms. You?

2. **Socket listener cleanup:** Is my fix correct or overkill?
   - Should we just remove the listener in cleanup?

3. **Debug logging:** Keep it or remove after testing?
   - I say keep it for production debugging.

4. **Backend nudge cooldown:** 30 seconds enough?
   - Too frequent? Not frequent enough?

---

## Test Plan

1. **Local test:**
   - Apply detection interval fix
   - Start session
   - Look away from camera
   - Score should drop within 1-2 seconds

2. **Socket.IO test:**
   - Open browser console
   - Start session
   - Look for `focus:update` events in console
   - Should see real-time updates

3. **Backend test:**
   - Check backend logs
   - Should see `/api/analyze` POST requests every 1 second

4. **Production test:**
   - Deploy to Railway
   - Test with real webcam
   - Verify score updates in real-time

---

## Questions for You (Tom)

1. Do you agree with the 1000ms detection interval?
2. Should we add more debug logging?
3. Any other issues you see in the code?
4. Want to pair program the fix together?

Let's ship this! 🚀
