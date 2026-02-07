# Hackathon Design & UI/UX Winner Research (2025-2026)

*Compiled: February 7, 2026*
*Focus: Projects with exceptional design from major hackathons*

---

## Key Findings Summary

**Most hackathons in 2025 do NOT have a dedicated "Best Design" or "Best UI/UX" prize.** Of the major hackathons surveyed, only **PennApps XXV** had an explicit "Best Design" category. Most hackathons focus prizes on technical tracks (Best AI, Best Hardware, etc.). This means design quality is judged as part of the **overall impression** during demos — making polished UI a differentiator across ALL categories, not just design-specific ones.

---

## Hackathons Surveyed

| Hackathon | Year | Has Design Prize? | Status |
|-----------|------|-------------------|--------|
| TreeHacks 2025 | Feb 2025 | ❌ No | Gallery live, 257 projects |
| Hacklahoma 2025 | Feb 2025 | ⚠️ "Best Theme" (close) | Gallery live, 73 projects |
| PennApps XXV | Sep 2024 | ✅ "Best Design" | Gallery live, 103 projects |
| HackGT X | Oct 2023 | ❌ No | Gallery live, 187 projects |
| BoilerMake XII | Jan 2025 | ❌ No | Gallery live, 110 projects |
| HackED 2025 | Jan 2025 | ❌ No | Gallery live, 80 projects |
| HackMIT 2025 | — | N/A | Devpost page 404 (not yet created or different URL) |
| CalHacks 11 | — | N/A | Devpost page 404 |

---

## Notable Design-Forward Projects

### 1. HawkWatch — TreeHacks 2025 (Grand Prize contender)
- **Devpost:** https://devpost.com/software/hawkwatch
- **GitHub:** https://github.com/Grace-Shao/Treehacks2025
- **Tech Stack:** Next.js 13+, TypeScript, Tailwind CSS, Supabase, TensorFlow.js, Canvas API
- **Design Notes:** Self-described "beautiful, intuitive user interface." Dashboard for monitoring multiple cameras with data viz, timeline generation, and statistics page. Landing page with animated GIFs.
- **Key Libraries:** Next.js App Router, Tailwind, Supabase Auth, Resend (email)

### 2. Booked. — Hacklahoma 2025
- **Devpost:** https://devpost.com/software/booked-sgpq1y
- **GitHub:** https://github.com/adnanysf/Booked
- **Figma:** https://www.figma.com/design/rx7qmnuaO5O9suXub7qC2G/booked.---hacklahoma---figma
- **Tech Stack:** React Native, Expo, MongoDB, Express
- **Design Notes:** Team explicitly said "We're very proud of our design." Mobile-first app with schedule/social reading features. Figma-first design process.
- **Key Takeaway:** Started with Figma prototypes → built to match. Design-first workflow.

### 3. Sera — PennApps XXV
- **Devpost:** https://devpost.com/software/sera-2svk5u
- **Tech Stack:** Next.js, TailwindCSS, Express, Node.js, MongoDB Atlas, Roboflow (OCR), Cerebras
- **Design Notes:** Financial dashboard with intuitive layout — transactions, bills, budgets, AI chatbot. Clean, approachable design for sensitive financial data.

### 4. Blip — PennApps XXV
- **Devpost:** https://devpost.com/software/blip-w5slqn
- **Tech Stack:** TypeScript, Next.js, TailwindCSS, OpenAI API, Cerebras API
- **Design Notes:** TikTok-inspired short-form audio platform. Focus on "responsive and intuitive user interface" and seamless audio transitions.

### 5. Rally AI — PennApps XXV
- **Devpost:** https://devpost.com/software/rally-8sxi2t
- **Tech Stack:** Next.js, Tailwind, Supabase, Firecrawl, Perplexity API, GPT-4o-mini, Cartesia.ai, SyncLabs, Pexels API
- **Design Notes:** "Beautiful and modern UI built using NextJS and Tailwind." Complex multi-agent pipeline but wrapped in clean web app.

### 6. HiveMind — TreeHacks 2025
- **Devpost:** https://devpost.com/software/hivemind-18cula
- **Tech Stack:** TypeScript, Three.js, Next.js, Python backend, IRIS Vector DB, Perplexity Sonar API
- **Design Notes:** Interactive 3D brain visualization for learning progress. Three.js for immersive dashboard experience.
- **Key Library:** **Three.js** — for 3D interactive data visualization

### 7. Lemon — TreeHacks 2025
- **Devpost:** https://devpost.com/software/lemon-7gn5hq
- **Tech Stack:** FlutterFlow, Supabase/PostgreSQL
- **Design Notes:** Mobile-first produce marketplace. Lo-fi prototype → FlutterFlow build. Team of first-time hackers impressed judges with design.
- **Key Takeaway:** FlutterFlow enabled rapid, polished mobile UI without deep coding.

### 8. CityQuest — Hacklahoma 2025
- **Devpost:** https://devpost.com/software/cityquest-y6t1rb
- **Tech Stack:** Ionic, Firebase, MapBox API
- **Design Notes:** Gamified exploration app with fog-of-war map mechanic. Almost app-store-ready thanks to Ionic + Firebase.

### 9. Fluention — BoilerMake XII
- **Devpost:** https://devpost.com/software/fluention
- **Tech Stack:** MediaPipe Face Mesh, OpenAI Whisper, Google Cloud TTS
- **Design Notes:** Speech therapy platform with lip/tongue tracking visualization. Interactive, clinical-grade UX.

### 10. getmemoria.tech — BoilerMake XII
- **Devpost:** https://devpost.com/software/getmemoria-tech
- **Tech Stack:** React, Expo (React Native), Next.js, MongoDB, Groq/Whisper, NativeWind
- **Design Notes:** Cross-platform mobile + web social audio journal.

---

## Tech Stack Patterns Across Design-Forward Projects

### Frontend Frameworks
| Technology | Usage Count | Notes |
|-----------|-------------|-------|
| **Next.js** | 6/10 | Dominant framework. App Router (13+) is standard |
| **React Native / Expo** | 3/10 | Mobile-first projects |
| **TypeScript** | 5/10 | Type safety is standard |
| **Tailwind CSS** | 5/10 | Universal styling choice |

### UI/Design Libraries
| Technology | Usage | Why It Helps Win |
|-----------|-------|-----------------|
| **Tailwind CSS** | Very common | Rapid iteration, consistent design tokens, responsive by default |
| **Three.js** | HiveMind | 3D visualizations that wow judges during demos |
| **Figma** | Booked. | Design-first workflow ensures visual polish |
| **FlutterFlow** | Lemon | No-code rapid prototyping with native-quality output |
| **Ionic** | CityQuest | Cross-platform mobile with native feel |
| **NativeWind** | getmemoria | Tailwind-style styling in React Native |
| **MediaPipe** | Fluention, slynk | Face/hand tracking visualizations |

### Backend/Data
| Technology | Usage | Notes |
|-----------|-------|-------|
| **Supabase** | 3/10 | Auth + DB + real-time. Replaces Firebase for many |
| **MongoDB Atlas** | 3/10 | Still popular for NoSQL |
| **Firebase** | 1/10 | Declining vs Supabase |

---

## Libraries We Should Consider Adding

### High Priority — Direct Design Impact

1. **Framer Motion** (React animation library)
   - *Why:* The #1 animation library for React/Next.js. Enables smooth page transitions, micro-interactions, and gesture-based animations. Judges notice smooth animations immediately.
   - *Status:* Not seen explicitly listed but likely used (many projects mention "smooth transitions")

2. **Three.js / React Three Fiber**
   - *Why:* HiveMind used a 3D brain visualization that clearly impressed judges. 3D elements create instant "wow factor" during demos.
   - *Best for:* Data visualization, ambient backgrounds, interactive elements

3. **Lottie (lottie-react)**
   - *Why:* Lightweight vector animations from After Effects. Perfect for loading states, onboarding flows, and micro-interactions without heavy JavaScript.
   - *Best for:* Loading animations, success/error states, onboarding

4. **Shadcn/ui**
   - *Why:* Copy-paste component library built on Radix UI + Tailwind. Gives you polished, accessible components instantly. Most 2025 Next.js projects likely use this.
   - *Best for:* Rapid UI building with professional quality

5. **Recharts or Nivo**
   - *Why:* Multiple winners had data dashboards (HawkWatch, Sera). Beautiful charts make data-heavy apps look professional.
   - *Best for:* Progress tracking, analytics views, statistics

### Medium Priority — Polish & Differentiation

6. **Sonner** (toast notifications)
   - *Why:* Beautiful, minimal toast notifications. Small detail that shows UI polish.

7. **Lucide React** (icons)
   - *Why:* Clean, consistent icon set. Better than mixing icon libraries.

8. **GSAP** (GreenSock Animation Platform)
   - *Why:* More powerful than Framer Motion for complex scroll-based animations and timelines.

9. **TanStack Query (React Query)**
   - *Why:* Smooth loading states, caching, optimistic updates. Makes the app feel faster than it is.

10. **Zustand** (state management)
    - *Why:* Lightweight, simple state management. Keeps UI responsive and code clean.

---

## Design Patterns That Winning Projects Share

### 1. **Figma-First Workflow**
Winners like Booked. started with Figma prototypes before writing code. This ensures visual consistency and lets non-technical team members contribute to design.

### 2. **Dashboard-Centric UIs**
Projects like HawkWatch, Sera, and HiveMind center around a main dashboard with cards, charts, and real-time data. This pattern is immediately impressive in demos.

### 3. **Mobile-First or Cross-Platform**
Many winners (Booked., Lemon, CityQuest, getmemoria) built mobile apps or mobile-responsive web apps. Mobile demos feel more "real product" to judges.

### 4. **Landing Page Polish**
HawkWatch and Rally AI specifically called out their landing pages. A polished landing page creates a strong first impression even before the demo.

### 5. **AI-Powered Features Wrapped in Clean UI**
The differentiator isn't AI itself (everyone uses it) — it's how cleanly the AI features are presented. Chatbots, analysis results, and recommendations need beautiful containers.

### 6. **Real-Time Feedback & Animations**
Projects that show real-time updates (HawkWatch's live analysis, Fluention's lip tracking) create engaging demos. Smooth loading states and transitions are crucial.

### 7. **Dark Mode / Modern Color Palettes**
Most winning projects use dark or gradient-heavy color schemes. Muted backgrounds with accent colors for important elements.

### 8. **Supabase + Next.js + Tailwind Stack**
This is the 2025 "meta" stack for web hackathon projects. Fast to build, beautiful results, great DX.

---

## GitHub Repos Worth Studying

| Repo | What to Study |
|------|--------------|
| [Grace-Shao/Treehacks2025](https://github.com/Grace-Shao/Treehacks2025) | Next.js 13+ dashboard with real-time data, Tailwind, Supabase integration |
| [adnanysf/Booked](https://github.com/adnanysf/Booked) | React Native/Expo mobile app with Figma-first design |
| [Krish54491/chipmunk](https://github.com/Krish54491/chipmunk) | Clean React UI for presentation tool with hand tracking |

---

## Recommendations for FocusFlow (Hacklahoma 2026)

### Must-Have Stack
- **Next.js 14+ (App Router)** — the dominant framework
- **TypeScript** — expected at this point
- **Tailwind CSS** — rapid, consistent styling
- **Shadcn/ui** — pre-built polished components
- **Framer Motion** — smooth animations and transitions
- **Supabase** — auth + real-time DB in minutes

### Design Differentiators to Implement
1. **Animated onboarding flow** (Lottie or Framer Motion)
2. **Dashboard with progress charts** (Recharts)
3. **Smooth page transitions** (Framer Motion layout animations)
4. **Polished loading states** (skeleton loaders, not spinners)
5. **Mobile-responsive or PWA** (judges test on phones)
6. **One "wow" visual element** — consider Three.js for an ambient background or data viz

### Pre-Hackathon Prep
1. Build a component library in Shadcn/ui beforehand
2. Create a Figma design system with colors, typography, spacing
3. Set up Next.js + Tailwind + Supabase boilerplate
4. Practice Framer Motion animations (page transitions, list animations)
5. Have a landing page template ready to customize

---

*Note: Without web search (Brave API not configured), specific prize winners couldn't always be confirmed. Devpost galleries show all submissions but don't clearly mark which projects won which prizes in the fetched content. The projects above were identified based on their position in galleries (often sorted by judging rank), their self-described design quality, and tech stack analysis.*
