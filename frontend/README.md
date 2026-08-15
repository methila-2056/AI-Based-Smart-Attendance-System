# Frontend — Smart Academic Companion

The React + TypeScript + Vite single-page application for the **AI-Based Smart Attendance System**.

## Scripts

| Command | Description |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Start the Vite dev server (proxies `/api` → `http://localhost:8080`) |
| `npm run build` | Type-check with `tsc -b` and produce the production bundle in `dist/` |
| `npm run lint` | Lint with Oxlint |
| `npm run preview` | Preview the production build locally |

## Environment

- `VITE_API_BASE` — optional base URL for API calls. Empty in development (uses the Vite proxy); production relies on the Vercel `/api` rewrites.

## Key structure

```
src/
├── api/          # API client (client.ts) & typed DTOs (types.ts)
├── auth/         # AuthContext + RequireAuth route guard
├── components/   # Layout shells, data tables, dialogs, UI primitives
├── pages/        # admin / analytics / student / teacher / Login
├── styles/       # Design tokens (tokens.css) & global styles
└── App.tsx       # React Router route definitions
```

See the [root README](../README.md) for architecture and deployment details.
