# ImpactLens AI — Operational Media Intelligence Platform

[![CI](https://github.com/soulvv/ImpactLens_CC/actions/workflows/ci.yml/badge.svg)](https://github.com/soulvv/ImpactLens_CC/actions/workflows/ci.yml)

> **Problem Statement 2 — Code Cubicle 6.0 | Production Architecture (Phases 1, 2, 3, 3.5, 4 + OmniDimension)**  
> AI-powered sustainability and environmental impact media intelligence platform for NGOs, governments, and research institutions.

---

## 0. Continuous Integration

Every push and pull request to `main` runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml), which reproduces the production build on a clean Linux runner with **no secrets and no `backend/.env`** — the conditions Render and Vercel actually run under:

| Job | What it proves |
| --- | --- |
| `Backend (FastAPI, py3.12 / py3.13 / py3.14)` | Dependencies install, the app imports, the full 48-path API surface registers, and `/health` returns 200. Run as a matrix because `render.yaml` intentionally does not pin `pythonVersion`, so every version Render could default to is covered. |
| `Frontend (Next.js)` | `npm ci` from the committed lockfile, `tsc --noEmit`, and `next build`. |

This exists because the local environment masks production failures. Three defects that would have broken a deploy passed locally and were caught only here: a startup `TypeError` when `FFMPEG_PATH` was unset, a `package-lock.json` out of sync with `package.json` (`npm ci` hard-fails on that), and a build-time fetch to `fonts.googleapis.com` that made `next build` intermittently fail. Fonts are now self-hosted under `frontend/app/fonts/`, so the frontend build needs no network access.

---

## 1. Project Overview

**ImpactLens AI** is an evidentiary intelligence platform for environmental projects. Organizations upload field photos, multispectral drone surveys, and monitoring video footage from ecological restoration sites. The system transforms unstructured media into verified, searchable, audit-grade evidence of environmental transformation.

### Fully Implemented Architecture Layers:
- **Phase 1 (Media Ingestion & Dossiers)**: High-throughput drag-and-drop media ingestion, Cloudinary cloud storage with offline local fallback, PostgreSQL relational persistence, and interactive project dossiers.
- **Phase 2 (Multimodal AI & Semantic Search)**: Gemini 1.5 Flash multimodal vision analysis for structured ecological tagging; 768-dimensional dense vector embeddings with cosine similarity search; OmniDimension conversational voice grounding.
- **Phase 3 (Before/After Impact Intelligence)**: Chronological baseline-to-survey visual comparisons, automated delta detection, ecological change classification (vegetation, cleanliness, infrastructure, hydrology), and confidence scoring.
- **Phase 3.5 (Video Intelligence & Keyframe Analysis)**: Native video pipeline with FFmpeg keyframe extraction, timestamped ecological key moments, transcript/soundscape analysis, and video semantic retrieval.
- **Phase 4 (Impact Reports & Storytelling)**: 100% evidence-backed field impact reports, narrative synthesis, donor/ESG campaign-ready content generation, and public shareable URLs with complete chain-of-custody traceability.

---

## 2. Directory Structure

```
ImpactLens_CC/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application entrypoint, CORS & startup diagnostics
│   │   ├── core/
│   │   │   └── config.py            # Pydantic Settings: DB, Cloudinary, Gemini, OmniDimension, FFmpeg
│   │   ├── db/
│   │   │   ├── database.py          # PostgreSQL sessionmaker & engine initialization
│   │   │   └── models.py            # SQLAlchemy models: Project, Media, Analysis, Comparison, Video, Report
│   │   ├── schemas/                 # Pydantic validation schemas across all phases
│   │   ├── services/
│   │   │   ├── ai_service.py        # Gemini 1.5 Flash multimodal image analysis
│   │   │   ├── embedding_service.py # 768-dim dense vector embeddings
│   │   │   ├── search_service.py    # Hybrid semantic vector search
│   │   │   ├── comparison_service.py# Before/After visual change reasoning
│   │   │   ├── video_service.py     # FFmpeg keyframe sampling & video scene analysis
│   │   │   ├── report_service.py    # Evidence aggregation & report generation
│   │   │   ├── omnidim_service.py   # OmniDimension voice session management & grounding
│   │   │   └── cloudinary_service.py# Cloudinary media uploader with local sandbox fallback
│   │   └── api/routes/
│   │       ├── health.py            # Safe configuration diagnostic endpoint (GET /health)
│   │       ├── media.py             # Media CRUD & upload pipeline
│   │       ├── projects.py          # Project dossier management
│   │       ├── search.py            # Semantic search API
│   │       ├── voice.py             # OmniDimension voice session & speech query grounding
│   │       ├── comparisons.py       # Before/After comparison endpoints
│   │       ├── videos.py            # Video intelligence & keyframe playback
│   │       ├── reports.py           # Field impact report generation & public share views
│   │       └── dashboard.py         # Aggregated platform telemetry
│   ├── .env.example                 # Backend environment variable template
│   ├── .env                         # Local backend secrets (git-ignored)
│   ├── .gitignore                   # Backend git ignore rules
│   ├── requirements.txt             # Python dependencies
│   └── test_phase4_end_to_end.py    # Full regression test suite (Phases 1-4)
├── frontend/
│   ├── app/                         # Next.js 15 App Router pages (Dashboard, Media, Compare, Reports, Projects)
│   ├── components/                  # Design-system UI components & OmniDimension voice modal
│   ├── lib/
│   │   ├── api.ts                   # Type-safe API client (strictly uses NEXT_PUBLIC_API_URL)
│   │   └── utils.ts                 # Styling & formatting utilities
│   ├── .env.example                 # Frontend environment template
│   ├── .env.local.example           # Frontend local template
│   ├── .env.local                   # Local frontend env (git-ignored)
│   ├── .gitignore                   # Frontend git ignore rules
│   └── package.json                 # Next.js dependencies
├── scripts/
│   ├── check_env.py                 # Automated environment & security validation script
│   └── check_secrets.py             # Secret leakage & git history auditor
├── .env.example                     # Root master template
├── .gitignore                       # Root git ignore rules
├── PRODUCT.md                       # Design manifesto & domain specification
└── README.md                        # Documentation & setup guide
```

---

## 3. Environment Configuration & Setup Guide

ImpactLens AI uses strict environment isolation. Server credentials remain exclusively on the backend and are **never** exposed to browser JavaScript or client bundles.

### 3.1 Architecture Overview

| Environment Scope | File Location | Permitted Contents |
| :--- | :--- | :--- |
| **Backend Environment** | `backend/.env` | Server secrets: PostgreSQL URL, Cloudinary API secret, Gemini key, OmniDimension key, FFmpeg paths, CORS rules |
| **Frontend Environment** | `frontend/.env.local` | **Browser-safe only**: `NEXT_PUBLIC_API_URL`. Zero server secrets permitted. |

---

### 3.2 Backend Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```

| Variable | Required? | Default / Format | Description |
| :--- | :--- | :--- | :--- |
| `PROJECT_NAME` | Optional | `"ImpactLens AI"` | Application title reported in telemetry & API headers. |
| `API_V1_STR` | Optional | `"/api"` | API routing prefix. |
| `ENVIRONMENT` | Optional | `development` | Deployment environment (`development`, `staging`, `production`). |
| `DEBUG` | Optional | `true` | Verbose debug logging flag. |
| `DATABASE_URL` | **Required** | `postgresql://user:pass@localhost:5432/impactlens_db` | Primary PostgreSQL connection string. |
| `CLOUDINARY_CLOUD_NAME` | Optional | `""` | Cloudinary cloud identifier for live media hosting. |
| `CLOUDINARY_API_KEY` | Optional | `""` | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Optional* | `""` | **SERVER-ONLY** Cloudinary secret. Required if Cloudinary is used. |
| `GEMINI_API_KEY` | Optional* | `""` | **SERVER-ONLY** Google Gemini API key. If omitted, heuristic fallback is active. |
| `GEMINI_MODEL` | Optional | `gemini-1.5-flash` | Canonical Gemini multimodal vision model. |
| `OMNIDIM_API_KEY` | Optional* | `""` | **SERVER-ONLY** OmniDimension voice assistant API key. |
| `OMNIDIM_AGENT_ID` | Optional* | `""` | OmniDimension voice agent identifier (configured in OmniDimension portal). |
| `OMNIDIM_BASE_URL` | Optional | `https://api.omnidimension.ai/v1` | Production OmniDimension API base URL. |
| `CORS_ORIGINS` | Recommended | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated list of allowed frontend origins. |
| `FFMPEG_PATH` | Optional | `ffmpeg` | Executable name or absolute path to `ffmpeg`. |
| `FFPROBE_PATH` | Optional | `ffprobe` | Executable name or absolute path to `ffprobe`. |
| `VIDEO_MAX_ANALYSIS_DURATION_SECONDS` | Optional | `180` | Maximum video duration sampled for scene keyframes. |
| `VIDEO_MAX_FRAMES` | Optional | `8` | Maximum number of representative keyframes extracted. |

*\*Note: If Cloudinary, Gemini, or OmniDimension credentials are not set, the platform starts gracefully in offline fallback mode with local storage, ecological heuristic analysis, and embedded voice synthesis.*

---

### 3.3 Frontend Configuration (`frontend/.env.local`)

Copy `frontend/.env.local.example` to `frontend/.env.local`:
```bash
cp frontend/.env.local.example frontend/.env.local
```

| Variable | Required? | Default / Value | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | **Required** | `http://127.0.0.1:8000` | Backend API base URL reachable by the browser. |

> **CRITICAL SECURITY NOTE**: Never place server secrets (`GEMINI_API_KEY`, `OMNIDIM_API_KEY`, `CLOUDINARY_API_SECRET`, `DATABASE_URL`) in `frontend/.env.local`. Any variable starting with `NEXT_PUBLIC_` is included in the compiled client-side JavaScript bundle and exposed to all website visitors.

---

### 3.4 Service-Specific Setup Details

#### 1. PostgreSQL Setup
- Install PostgreSQL 14+ (or PostgreSQL 17).
- Create a database:
  ```sql
  CREATE DATABASE impactlens_db;
  ```
- Configure `DATABASE_URL=postgresql://<user>:<password>@localhost:5432/impactlens_db` in `backend/.env`.
- Database tables and initial sample dossiers are automatically seeded on startup via SQLAlchemy.

#### 2. Cloudinary Setup
- Create an account at [Cloudinary Console](https://cloudinary.com/console).
- Retrieve your **Cloud Name**, **API Key**, and **API Secret**.
- Add them to `backend/.env`:
  ```ini
  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=your_api_key
  CLOUDINARY_API_SECRET=your_api_secret
  ```
- *Security*: The API secret remains on the backend. Client uploads pass securely through the backend upload gateway (`POST /api/media/upload`), which uploads to Cloudinary and returns safe public URLs.

#### 3. Google Gemini Setup
- Obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
- Add the key to `backend/.env`:
  ```ini
  GEMINI_API_KEY=your_gemini_api_key
  GEMINI_MODEL=gemini-1.5-flash
  ```
- Gemini is used across:
  - Phase 2: Multimodal image tagging and 768-dim embeddings (`text-embedding-004`).
  - Phase 3: Visual delta reasoning between baseline and survey photographs.
  - Phase 3.5: Video keyframe scene comprehension.
  - Phase 4: Grounded impact report synthesis.

#### 4. OmniDimension Voice Assistant Setup
- Access the [OmniDimension Dashboard](https://omnidimension.ai).
- Create an agent with the ImpactLens voice profile and obtain your **API Key** and **Agent ID**.
- Add credentials to `backend/.env`:
  ```ini
  OMNIDIM_API_KEY=your_omnidim_api_key
  OMNIDIM_AGENT_ID=your_agent_id
  ```
- *Session Security Model*: The browser calls `POST /api/voice/session`. The backend authenticates with OmniDimension using `OMNIDIM_API_KEY` (Bearer auth) and returns a temporary short-lived connection session to the browser. The browser never receives or stores `OMNIDIM_API_KEY`.

#### 5. FFmpeg Video Pipeline Setup (Phase 3.5)
- **Windows**: Install via `winget install Gyan.FFmpeg` or download from [ffmpeg.org](https://ffmpeg.org). Ensure `ffmpeg` and `ffprobe` are on your system `PATH`.
- **macOS**: `brew install ffmpeg`
- **Ubuntu/Debian**: `sudo apt update && sudo apt install ffmpeg`
- If FFmpeg is installed in a non-standard directory, provide the absolute path in `backend/.env`:
  ```ini
  FFMPEG_PATH="C:\ffmpeg\bin\ffmpeg.exe"
  FFPROBE_PATH="C:\ffmpeg\bin\ffprobe.exe"
  ```

#### 6. CORS Configuration
- In `backend/.env`:
  ```ini
  CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
  ```
- The backend parses comma-separated origins and configures FastAPI's `CORSMiddleware` to allow credentials, GET, POST, PUT, DELETE, and OPTIONS requests from your local frontend.

#### 7. Background Tasks & Message Broker (Redis Note)
- ImpactLens AI uses FastAPI's asynchronous background execution (`fastapi.BackgroundTasks`) backed by PostgreSQL status transitions for media analysis and report compilation.
- **No external Redis or Celery broker is required** for the current architecture, keeping deployment lightweight and deterministic.

#### 8. Authentication & Multi-Tenancy Note
- The current implementation is designed for internal environmental research teams, field monitors, and NGO program officers operating as verified field auditors.
- No third-party OAuth/Supabase credentials are required for local operation.

---

## 4. Automated Environment & Security Check

We provide an automated verification script that audits configuration files, validates formats, tests database connectivity, and ensures zero secrets leak into the frontend:

```bash
# From the project root:
python scripts/check_env.py
```

Expected output:
```
==================================================
 ImpactLens AI — Environment Configuration Audit 
==================================================

1. Checking Configuration Files:
  ✓ Root .env.example exists (.env.example)
  ✓ Root .gitignore exists (.gitignore)
  ✓ Backend .env.example exists (.env.example)
  ✓ Backend .env exists (.env)
  ✓ Backend .gitignore exists (.gitignore)
  ✓ Frontend .env.example exists (.env.example)
  ✓ Frontend .env.local.example exists (.env.local.example)
  ✓ Frontend .env.local exists (.env.local)
  ✓ Frontend .gitignore exists (.gitignore)

2. Validating Backend Environment (backend/.env):
  ✓ DATABASE_URL configured: postgresql://postgres:***@localhost:5432/impactlens_db
  ✓ CORS_ORIGINS configured (2 origins: http://localhost:3000, http://127.0.0.1:3000)

3. Validating Frontend Environment (frontend/.env.local):
  ✓ NEXT_PUBLIC_API_URL configured: http://127.0.0.1:8000
  ✓ Zero server secrets detected in frontend/.env.local

4. Scanning Frontend Source Code for Secret References:
  ✓ Zero server secrets referenced in frontend TypeScript/JavaScript source code

==================================================
PASSED: Environment configuration is complete, consistent, and secure!
```

---

## 5. Startup & Execution Instructions

### Step 1: Start PostgreSQL
Ensure PostgreSQL 17 is running on port 5432 with database `impactlens_db` created.

### Step 2: Start the Backend API
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Endpoint: `http://127.0.0.1:8000`
- Safe Diagnostics: `http://127.0.0.1:8000/health`
- Swagger Documentation: `http://127.0.0.1:8000/docs`

### Step 3: Start the Frontend Application
```bash
cd frontend
npm run dev
```
- Web Application: `http://localhost:3000`

---

## 6. Startup Health Diagnostics (`GET /health`)

The `/health` endpoint safely reports configuration readiness without ever leaking secrets, passwords, or connection strings:

```json
{
  "status": "ok",
  "service": "ImpactLens AI",
  "version": "1.0.0",
  "environment": "development",
  "database": true,
  "cloudinary": "disabled",
  "gemini": "disabled",
  "omnidimension": "disabled",
  "video_processing": "disabled",
  "details": {
    "database": {
      "connected": true,
      "engine": "postgresql"
    },
    "cloudinary": {
      "status": "disabled",
      "cloud_name_set": false,
      "api_key_set": false,
      "api_secret_set": false
    },
    "gemini": {
      "status": "disabled",
      "api_key_set": false,
      "model": "gemini-1.5-flash"
    },
    "omnidimension": {
      "status": "disabled",
      "api_key_set": false,
      "agent_id_set": false
    },
    "ffmpeg": {
      "available": false,
      "binary": "ffmpeg"
    }
  },
  "timestamp": "2026-09-24T17:42:58.700490+00:00"
}
```

---

## 7. Complete Test Suite

Run the full end-to-end regression test suite covering all implemented phases:

```bash
# Test Phase 2 (AI understanding, embeddings, semantic search, voice grounding)
python backend/test_phase2.py

# Test Phase 3 (Before/After visual delta analysis & pairing)
python backend/test_phase3.py

# Test Phase 3.5 (Video intelligence, keyframe extraction, video search)
python backend/test_phase3_5.py

# Comprehensive End-to-End Regression Suite (Phases 1 through 4)
python backend/test_phase4_end_to_end.py
```

---

## 8. Production Deployment (Render + Vercel)

Deployment is split across two platforms. **Deploy the backend first** — the
frontend needs the resulting URL before it can be built.

```
Vercel  ──▶  frontend (Next.js, root dir: frontend/)   :443
               │  browser calls NEXT_PUBLIC_API_URL
               ▼
Render  ──▶  backend (FastAPI, root dir: backend/)      :8000
               ├──▶ PostgreSQL   (Neon or Supabase — NOT Render's free Postgres)
               └──▶ Cloudinary  (media bytes; Render's disk is ephemeral)
```

### 8.1 Why the backend must go first

`NEXT_PUBLIC_API_URL` is inlined into the client bundle **at build time**
(`frontend/lib/api.ts:10`). Vercel cannot know the Render URL until the backend
exists, so deploying the frontend first bakes in a dead address and forces a
redeploy.

### 8.2 Provision the database

Do **not** rely on the SQLite fallback. `app/db/database.py:14-34` catches any
PostgreSQL connection failure and silently switches to `sqlite:///./impactlens.db`.
Render's filesystem is ephemeral, so every deploy, restart, and crash-loop
discards the database — with a `warning` in the log and HTTP 200 from `/health`.
There is no error to alert on.

Use **Neon** or **Supabase**. Render's own free Postgres is deleted after 30 days.

Tables are created and seeded automatically on startup by `init_db()`.

### 8.3 Deploy the backend to Render

Import the repo as a **Blueprint** (Render reads `render.yaml`), or configure manually:

| Setting | Value |
| :--- | :--- |
| Root Directory | `backend` |
| Runtime | Python |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/health` |

Render prompts for the `sync: false` secrets in `render.yaml`. See
`.env.production.example` for the full list and what breaks if each is missing.

> Do not use `backend/run.py` as the start command — it hardcodes
> `reload=True` and `port=8000`, both wrong in production.

### 8.4 Deploy the frontend to Vercel

| Setting | Value |
| :--- | :--- |
| Root Directory | `frontend` |
| Framework | Next.js (auto-detected) |
| `NEXT_PUBLIC_API_URL` | the Render URL — set for **Production, Preview, and Development** |

### 8.5 CORS — the step that usually breaks

`CORS_ORIGINS` is read **once at startup** (`app/main.py:79-89`). Setting it in
the Render dashboard is not enough; the service must **redeploy** to reload it.

Set it to your Vercel origin, comma-separated for multiple:
```
CORS_ORIGINS=https://impactlens.vercel.app
```
Never use `*` — `main.py` sets `allow_credentials=True`, and browsers reject
credentialed requests against a wildcard origin.

### 8.6 Verify

```bash
curl https://<your-render-service>.onrender.com/health
```

Confirm `"engine": "postgresql"` (not `sqlite`), then load the Vercel URL, open
DevTools → Network, and check the `/api/*` XHRs return 200. Upload one image
end-to-end — that exercises Cloudinary, PostgreSQL, and Gemini analysis at once.

### 8.7 Operational notes

- **Free instances sleep after ~15 minutes idle.** The first visitor after a lull
  waits for a cold start; the page may render a spinner rather than an error.
- **Media analysis runs in-process** via `BackgroundTasks` (`media.py:139`), after
  the upload response returns. If the instance sleeps or restarts mid-analysis the
  job dies silently and the row stays in `processing`; re-trigger it with
  `POST /api/media/{id}/retry-analysis`.
- **No FFmpeg on the native Python runtime.** System packages cannot be installed,
  so `VideoService` degrades to Cloudinary `so_<seconds>` frame extraction
  (`video_service.py:158`), which still returns real per-timestamp JPEGs. Switch
  to Render's Docker runtime with an FFmpeg layer if you need local extraction.
- **There is no authentication on any endpoint**, including
  `DELETE /api/media/{id}`. Treat the deployed API as trusted-network-only until
  auth is added.
- `google-generativeai` is deprecated and logs a `FutureWarning` on every boot.
  Migrating to `google-genai` touches `ai_service.py`, `embedding_service.py`,
  `comparison_service.py`, and `report_service.py`.
