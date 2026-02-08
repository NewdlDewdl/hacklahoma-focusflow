# FocusFlow — AI-Powered Focus Tracker with Multiplayer Accountability

## Tagline
Real-time focus coaching that keeps you on task — with AI nudges, voice, and multiplayer accountability.

## Inspiration
Staying focused is hard when you’re alone. We wanted something that *actually keeps you accountable* without sending your webcam to the cloud. FocusFlow uses **local, private** attention tracking and pairs it with **AI coaching** plus **multiplayer rooms** so you can lock in with friends.

## What it does
- **Solo mode:** Start a focus session, allow webcam access, and see a live **0–100 focus score**.
- **AI nudges:** When focus drops, Gemini generates a short coaching nudge (“Eyes on the screen”), and ElevenLabs speaks it aloud.
- **Multiplayer rooms:** Create/join rooms, see a **live leaderboard**, and keep each other accountable.
- **Token rewards:** Session stats + streaks compute **FOCUS tokens** (Solana-based).
- **Privacy-first:** Human.js runs locally — only lightweight focus metrics are sent to the backend.

## How we built it
- **Frontend:** Next.js + TypeScript + Tailwind + Framer Motion (Vintage Cartography Theme)
- **Backend:** Express + Socket.io (real-time events)
- **AI Coaching:** Gemini (Google GenAI) generates short nudges
- **Voice:** ElevenLabs TTS produces audio nudges
- **Persistence:** MongoDB (Atlas-ready; in-memory fallback for demo reliability)
- **Tokenization:** Solana web3.js for FOCUS token logic
- **Deployment:** DigitalOcean App Platform (demo URL)
- **Testing:** Playwright E2E (13/13 passing)

## Challenges we ran into
- Real-time webcam inference without sending video to the cloud
- Keeping latency low for live focus scores + nudges
- Syncing multiplayer state over websockets reliably
- Handling API failures gracefully while preserving demo flow

## Accomplishments that we’re proud of
- Full end-to-end system with **live Human.js tracking**
- **AI coaching + voice nudges** that trigger automatically
- **Multiplayer rooms** with live leaderboard updates
- **Comprehensive E2E tests** for both frontend + backend
- All 5 sponsor technologies integrated in a cohesive product

## What’s next for FocusFlow
- Personalized coaching profiles
- Mobile companion app
- Streaks + long-term analytics dashboards
- Better multiplayer matching + team challenges

---

## Links (fill in)
- **Demo URL (DigitalOcean):** <TBD>
- **GitHub Repo:** <TBD>
- **Demo Video:** <TBD>
- **Team Members:** <TBD>

## Sponsor Tech Stack (explicit)
- **Gemini** — real-time coaching nudges
- **ElevenLabs** — voice feedback
- **MongoDB** — session persistence (Atlas-ready)
- **Solana** — FOCUS token logic
- **DigitalOcean** — deployment platform
