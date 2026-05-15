# AI-Driven Placement Intelligence Ecosystem

## Original Problem Statement
Build a production-ready AI placement platform serving Students, Placement Coordinators, and Companies/Recruiters. Includes resume intelligence, placement prediction, company matching, AI interview coach, and analytics. Design must feel premium and minimal (OpenAI/Linear/Vercel aesthetic), not flashy.

## Architecture (MVP — phase 1)
- **Backend**: FastAPI + MongoDB (motor) + JWT auth (bcrypt) + Claude Sonnet 4.5 via emergentintegrations
- **Frontend**: React 19 + Tailwind + shadcn UI + Framer Motion + Recharts + Zustand
- **Theme**: Dark minimalist (Vercel/Linear inspired) — #050505 bg, 1px white/10 borders, IBM Plex Sans + JetBrains Mono

## User Personas
1. **Student** — uploads resume, sees placement probability, gets matched companies, prepares for interviews
2. **Placement Coordinator** — monitors analytics, funnel, at-risk students, skill demand/supply
3. **Recruiter** — posts JDs, gets AI-ranked candidate shortlists

## Implemented (2026-02-14)
### Backend
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` — JWT
- `POST /api/resume/upload` (PDF), `POST /api/resume/analyze` (text), `GET /api/resume/me` — Claude-powered ATS scoring + structured extraction
- `GET /api/predict/me` — weighted feature model with contributions, insights, risk level, expected CTC
- `POST /api/jobs`, `GET /api/jobs`, `GET /api/jobs/mine`, `DELETE /api/jobs/{id}` — RBAC enforced
- `GET /api/match/recommendations` — student↔job fit scoring
- `POST /api/match/shortlist` — recruiter candidate ranking
- `POST /api/interview/start`, `POST /api/interview/message`, `GET /api/interview/sessions` — multi-turn Claude interview coach
- `POST /api/mentor/chat` — career mentor agent
- `GET /api/analytics/overview` — KPIs, funnel, branch dist, skill heatmap, at-risk, CTC trend
- Seed demo data on startup (idempotent)

### Frontend
- Landing page with animated SVG/canvas network nodes background, features grid, AI agents list, CTA
- Login/Signup with role selector, demo account quick-fill
- Authenticated layout: glassmorphic navbar + role-aware sidebar
- Student Dashboard: probability/ATS/CTC KPIs, feature contributions bar chart, skill radar, AI insights, top company matches
- Resume Analysis: paste/upload, score breakdown, skills/missing keywords, improvements, project list
- Companies/Jobs board: ranked by personalized fit score
- Interview Coach: chat UI with role/type selection, final score detection
- Recruiter Dashboard: job CRUD form
- Shortlist: ranked candidates table with ATS bars and fit scores
- Analytics: KPIs + funnel + branch + skill demand/supply + CTC trend + at-risk

## Prioritized Backlog
### P0 (next)
- Validate testing report and fix any blockers

### P1
- Voice mode for interview (OpenAI Whisper)
- Live notifications (WebSocket)
- AI Mentor chat UI page
- Resume PDF upload UI polish (drag-drop active state)

### P2
- SHAP explainability graphs
- 3D React Three Fiber hero (currently 2D canvas)
- Celery/Redis background jobs
- Resume version history
- Company JD bulk import / scraping
- Admin role + drives scheduling

## Test Credentials
See `/app/memory/test_credentials.md`
