# Smart Academic Companion

Hackathon prototype for problem **IH-01 — Smart Curriculum Activity & Attendance App** (Smart Education domain).

A role-based academic platform combining period/hour-wise QR attendance, fixed timetable management, teacher absence → free-period detection, a Smart Planner for free-period study recommendations, and attendance analytics.

## Architecture

- `backend/` — Spring Boot (Java 25, Maven), layered Controller → Service → Repository → Entity, JWT auth, Spring Data JPA, PostgreSQL
- `frontend/` — React + TypeScript + Vite, React Router, CSS Modules with a navy/indigo design system and dark theme

## Getting started

### Backend

1. Create the database (PostgreSQL 18):
   ```
   "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE smart_academic;"
   ```
2. Configure `backend/src/main/resources/application.yml` or env vars (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`).
3. Run: `cd backend && mvn spring-boot:run`

### Frontend

1. `cd frontend && npm install`
2. `npm run dev` (proxies `/api` to `http://localhost:8080`)

## Demo accounts

| Role | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `Admin@123` |
| Attendance Coordinator | `rajasekar` | `Raj@123` |
| Subject Staff | `pavithra` | `Pav@123` |
| Subject Staff | `arunkumar` | `Arun@123` |
| Subject Staff | `keerthana` | `Kee@123` |
| Student | `mohan23` | `Student@123` |

See `smart_academic_companion_implementation_plan.md` for the full product plan.
