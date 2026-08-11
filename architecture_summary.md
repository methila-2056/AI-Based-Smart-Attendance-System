# Technical Architecture & Features Reference Manual

This document serves as a technical manual and reference guide for the **Smart Academic Companion** project, explaining the architecture, package structure, dependencies, and core features implemented across the frontend, backend, and database.

---

## 1. System Architecture Overview

The system follows a standard three-tier architecture configured for modern cloud deployment:

```
+---------------------------+
| Vercel Static Frontend    |
| (React / TS / Vite SPA)   |
+-------------+-------------+
              |
              | (HTTP / JSON API)
              v
+-------------+-------------+
| Vercel Edge API Rewrite   |
| (Reverse Proxy /api/*)    |
+-------------+-------------+
              |
              | (Proxy Pass)
              v
+-------------+-------------+
| Render Java Backend       |
| (Spring Boot Server)      |
+-------------+-------------+
              |
              | (JDBC connection)
              v
+-------------+-------------+
| Neon PostgreSQL           |
| (Serverless Cloud DB)     |
+---------------------------+
```

* **Frontend Hosting (Vercel)**: Serves static React/TypeScript assets built via Vite. Features fallback routing for Single Page Applications (SPAs) and proxy rules to redirect `/api/*` requests to the Render backend to prevent CORS issues.
* **Backend Hosting (Render)**: Runs the compiled Java Spring Boot executable container, exposing REST endpoints on port 8080.
* **Database (Neon)**: Serverless cloud PostgreSQL database storing relational college ERP schema.

---

## 2. Database Layer (PostgreSQL on Neon)

The database schema is managed dynamically by Hibernate JPA using `ddl-auto: update` or `create`. The relational schema contains the following entity tables:

### Core Entity Tables
* **`departments`**: Academic departments (e.g. CSE, IT).
* **`academic_years`**: Active academic cycles (e.g. 2026–2027).
* **`semesters`**: Active semesters mapped to academic years.
* **`sections`**: Student class subgroups (e.g. "III CSE A").
* **`subjects`**: Course catalog (Code, Name, SubjectType [Theory/Lab]).
* **`staff`**: Faculty directory.
* **`students`**: Student directory with register numbers and section mappings.
* **`users`**: Auth credentials (Usernames, bcrypt-hashed passwords, Roles [ADMIN, TEACHER, STUDENT, COORDINATOR]).
* **`timetable_entries`**: Mappings of periods (1–7), days (Monday–Friday), subjects, sections, and staff.

### Transactional & Feature Tables
* **`attendance_sessions`**: Tracks active or closed classroom attendance sessions for specific periods, storing the generated 8-digit numeric token code (`currentToken`) and expiration timestamps.
* **`attendance_records`**: Logs individual student attendance statuses (`PRESENT`, `ABSENT`, `OD_PRESENT`) marked against specific `attendance_sessions`.
* **`assignments`, `tasks`, `tests`, `resources`**: Study content and planner data associated with specific sections and semesters.
* **`student_task_completions`**: Tracks task completion timestamps for individual students.

---

## 3. Backend Layer (Java Spring Boot)

The Spring Boot backend is organized into domain-driven packages.

### Directory Structure & Packages
```
src/main/java/com/smartacademic/
├── admin/              # Administrator dashboards, section management
├── attendance/         # Attendance sessions, records, QrTokenService
├── auth/               # User Authentication, login endpoints
├── common/             # ClockService (time management), exceptions
├── config/             # SecurityConfig, DataSeeder, ContentSeeder (bootstrap data)
├── content/            # Study planner content (Tasks, Assignments, Resources, Tests)
├── master/             # Academic ERP directory (Students, Staff, Sections, Subjects, Timetables)
├── student/            # Student-specific dashboards and task actions
├── teacher/            # Faculty actions (start session, refresh QR, close session)
└── user/               # User accounts management
```

### Core Technologies Used
* **Framework**: Spring Boot 3.2+ (JVM 17/21/25).
* **Data Access**: Spring Data JPA & Hibernate ORM.
* **Security**: Spring Security configured with custom JWT token filter and Stateless Sessions.
* **Validation**: Hibernate Validator (`jakarta.validation`).

---

## 4. Frontend Layer (React / TypeScript / Vite)

The frontend is a lightweight Single Page Application (SPA) designed with a clean design system using native CSS tokens.

### Directory Structure & Packages
```
frontend/src/
├── api/                # client.ts (API wrappers), types.ts (DTO schemas)
├── auth/               # AuthContext.tsx (user session context), RequireAuth.tsx (routes guard)
├── components/         # Layout shells, data tables, modal dialogs, UI primitives, SVGs
├── pages/
│   ├── admin/          # Admin CRUD dashboards (Staff, Students, Timetables)
│   ├── analytics/      # Coordinator attendance shortage logs & charts
│   ├── student/        # Student Scanner, MyAttendance, Smart Study Planner
│   ├── teacher/        # Faculty Class Hub & Projector QR Code generator
│   └── Login.tsx       # Landing page and credentials form
├── styles/             # global.css (vanilla styling), tokens.css (theme tokens)
└── App.tsx             # Route definitions (React Router DOM)
```

### Key Technical Controls
* **State Management**: React Context (`AuthContext` for credentials, `ToastContext` for alerts).
* **Styling**: Vanilla CSS custom properties (`tokens.css` for light/dark mode variables).
* **Auth Storage**: **`sessionStorage`** is utilized instead of `localStorage` to isolate user sessions. This allows developers to log in as a Teacher in Tab 1 and a Student in Tab 2 simultaneously in the same browser without account conflicts.

---

## 5. Summary of Core Features

If anyone asks what features the application supports, here is the feature checklist:

1. **Student QR Attendance Scanner**: 
   * Students enter a secure 8-digit numeric token displayed by their faculty on the projector.
   * Instant verification checks the code in real-time, marks the student present, and records timestamps.
2. **Timetable & Active Session Generator**: 
   * Teachers view their daily classes matching the active timetable.
   * Clicking "Start Session" generates a randomized 8-digit numeric token valid for 3 minutes, automatically rendering a projector-ready QR code.
3. **Smart Study Planner**:
   * Timetable-driven system that checks if a student is in a free period (e.g. if the teacher marked themselves absent).
   * Automatically calculates remaining free minutes and recommends priority study tasks, assignment deadlines, or test preparation guides that fit within that exact timeframe.
4. **Attendance Analytics**:
   * Coordinators view section-wise attendance metrics.
   * Highlights students running below the minimum 75% attendance threshold with red flags and shortage logs.
