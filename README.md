# HRUS Frontend

A single-page Next.js (App Router, TypeScript) frontend for the HRUS medical
image classification API. Upload a histology scan, get a predicted class
(`ALS` / `Control`) with a confidence score and per-class probabilities.

This is a **research prototype UI**, not a diagnostic tool.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- No server-side API routes — the browser calls the FastAPI backend directly
  at `https://hrus-api.onrender.com`

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/
  layout.tsx       Root layout, font setup, metadata
  page.tsx          Main (and only) page: upload → analyze → result flow
  globals.css       Tailwind base styles, background texture, focus states
components/
  UploadZone.tsx      Drag-and-drop / click-to-browse upload with preview
  ResultCard.tsx       Label badge, confidence, probability bars
  StatusIndicator.tsx  Online / waking up / offline pill in the header
lib/
  api.ts       fetch wrappers for /health and /predict, incl. timeouts
  types.ts     Shared TypeScript types for API responses
```

## Notes on backend behavior

The API is hosted on Render's free tier, which spins down after periods of
inactivity. The first request after idle time can take 30–60 seconds to
respond while the instance wakes up:

- On load, the app polls `GET /health` to show an online/offline indicator
  in the header (re-checked every 45s).
- When you hit **Analyze** while the backend isn't confirmed online, the UI
  waits briefly and then switches the button and status pill to a
  "waking up backend" state instead of failing — the underlying request
  keeps waiting (up to 90s) rather than erroring out immediately.
- Network failures, timeouts, server errors (5xx), and validation errors
  (unsupported file type, backend rejecting the file) each get a distinct,
  human-readable message.

## Customizing the API URL

The backend base URL is a constant, `API_BASE_URL`, at the top of
`lib/api.ts`. Change it there if you point this UI at a different deployment.
