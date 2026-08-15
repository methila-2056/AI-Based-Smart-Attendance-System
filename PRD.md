# Product Requirements Document (PRD)

## AI-Based Smart Attendance System

| | |
| --- | --- |
| **Project Name** | AI-Based Smart Attendance System (Smart Academic Companion) |
| **Problem Statement** | IH-01 — Smart Curriculum Activity & Attendance App (Smart Education domain) |
| **Document Version** | 1.0 |
| **Prepared By** | Methila M |
| **Repository** | https://github.com/methila-2056/AI-Based-Smart-Attendance-System |
| **Live Demo** | https://ai-based-smart-attendance-system-omega.vercel.app |
| **Backend API** | https://ai-based-smart-attendance-system-7csy.onrender.com |
| **Last Updated** | August 2026 |

---

## 1. Product Overview

The **AI-Based Smart Attendance System** is a full-stack, role-based academic web application that enables:

1. **Period-wise QR attendance** — teachers generate secure, time-boxed tokens; students mark attendance instantly.
2. **Fixed timetable management** — period/day-wise subject, section, and staff scheduling.
3. **Free-period detection** — automatic identification of free periods (e.g., teacher absence).
4. **Smart Study Planner** — recommends tasks, assignments, and test-prep that fit the available free time.
5. **Attendance analytics** — section-wise metrics and shortage warnings for compliance monitoring.

---

## 2. Target Users & Personas

### P1 — Administrator
- **Goals:** Maintain master data, manage OD events, ensure data integrity.
- **Pain Points:** Manual data entry across disconnected spreadsheets.
- **Success:** Centralized, accurate master data with minimal maintenance effort.

### P2 — Attendance Coordinator
- **Goals:** Monitor attendance health across sections.
- **Pain Points:** Manual report generation to find at-risk students.
- **Success:** One-click analytics with automatic <75% shortage flags.

### P3 — Subject Staff / Teacher
- **Goals:** Mark attendance fast and start class on time.
- **Pain Points:** Roll-call consumes lecture time.
- **Success:** One-click session start → QR on projector → close session.

### P4 — Student
- **Goals:** Mark attendance easily, track attendance %, plan study.
- **Pain Points:** Long queues, proxy marking, no visibility into attendance status.
- **Success:** Token entry in <10 seconds; planner suggests what to study in free periods.

---

## 3. User Stories

| ID | User Story | Priority |
| --- | --- | --- |
| US-1 | As a teacher, I want to start an attendance session for my current class so that students can mark presence immediately. | P0 |
| US-2 | As a teacher, I want a projector-ready QR code with an 8-digit token so that the whole class can join quickly. | P0 |
| US-3 | As a student, I want to enter the token and be marked present instantly. | P0 |
| US-4 | As a coordinator, I want section-wise analytics with students below 75% flagged. | P0 |
| US-5 | As a student, I want a Smart Planner that recommends tasks matching my free time. | P0 |
| US-6 | As an admin, I want to manage departments, sections, staff, students, subjects, and timetables. | P0 |
| US-7 | As a teacher, I want to view today's classes from the timetable. | P1 |
| US-8 | As an admin, I want to create OD (on-duty) events and map affected periods. | P1 |
| US-9 | As a student, I want to view my attendance history per subject. | P1 |
| US-10 | As a teacher, I want to publish assignments, tasks, tests, and resources. | P1 |

---

## 4. Functional Requirements

### FR-1: Authentication & Authorization
| Item | Specification |
| --- | --- |
| FR-1.1 | Login via username + password (bcrypt-hashed). |
| FR-1.2 | JWT issued on successful login; stateless session. |
| FR-1.3 | Roles enforced: `ADMIN`, `STAFF` (Subject Staff + Attendance Coordinator), `STUDENT`. |
| FR-1.4 | Route guards on frontend and method-level security on backend. |
| FR-1.5 | Token stored in `sessionStorage` (per-tab isolation for multi-role testing). |

### FR-2: Timetable & Session Management
| Item | Specification |
| --- | --- |
| FR-2.1 | Timetable entries: day (Mon–Fri), period (1–7), subject, section, staff, optional secondary staff, test flag. |
| FR-2.2 | Teacher dashboard lists today's classes with status (`ACTIVE`/`CLOSED`/`ABSENT`). |
| FR-2.3 | "Start Session" generates a randomized **8-digit numeric token**, valid **3 minutes**. |
| FR-2.4 | Session renders a projector-ready **QR code** and shows the token. |
| FR-2.5 | Teacher can close sessions early and mark sessions as teacher-absent (creating free periods). |

### FR-3: Student Attendance Scanner
| Item | Specification |
| --- | --- |
| FR-3.1 | Student enters the 8-digit token to mark attendance. |
| FR-3.2 | Token verified in real-time against the active session; records `PRESENT` status and timestamp. |
| FR-3.3 | Duplicate marking within a session is rejected. |
| FR-3.4 | Attendance summary tracks `PRESENT`, `OD_PRESENT`, `ABSENT` and percentage per subject and overall. |

### FR-4: Smart Study Planner
| Item | Specification |
| --- | --- |
| FR-4.1 | Detects free periods from the timetable and session status. |
| FR-4.2 | Computes remaining free minutes for the current free block. |
| FR-4.3 | Recommends tasks/assignments/tests whose estimated duration fits the free window. |
| FR-4.4 | Shows explanation per recommendation and marks items complete when finished. |

### FR-5: Attendance Analytics
| Item | Specification |
| --- | --- |
| FR-5.1 | Overview: total/present/OD/absent periods and hours, overall percentage. |
| FR-5.2 | Subject-wise and section-wise statistics. |
| FR-5.3 | Student shortage list for students **below 75%** with shortfall details. |
| FR-5.4 | Monthly trend points for period-wise attendance patterns. |

### FR-6: Admin Master Data Management
| Item | Specification |
| --- | --- |
| FR-6.1 | Departments, academic years, semesters, sections, staff, students, subjects. |
| FR-6.2 | Staff–subject–section assignments with primary/secondary designation. |
| FR-6.3 | Timetable editor with unassigned-period visibility. |
| FR-6.4 | OD event creation with affected periods and student lists. |

### FR-7: Content & Subject Hub
| Item | Specification |
| --- | --- |
| FR-7.1 | Teachers publish assignments, tasks, tests, and resources per subject/section. |
| FR-7.2 | Students consume content and track task completions. |

---

## 5. Non-Functional Requirements

| Category | Requirement |
| --- | --- |
| **Performance** | API responses < 300ms (p95) on standard datasets; dashboard < 3s. |
| **Security** | HTTPS, JWT auth, bcrypt passwords, CORS allow-list, no secrets in code. |
| **Scalability** | Stateless backend; horizontally scalable; serverless DB. |
| **Availability** | 99.5%+ on cloud hosting; graceful degradation on DB cold start. |
| **Usability** | Responsive SPA, keyboard navigable, clear role-based navigation. |
| **Accessibility** | Semantic HTML, sufficient color contrast, theme support (light/dark). |
| **Data Integrity** | Foreign-key constrained schema; Hibernate-managed schema updates. |
| **Observability** | Structured logs; health-check endpoint for platform monitoring. |

---

## 6. Data Model (Key Entities)

| Entity | Purpose | Notable Fields |
| --- | --- | --- |
| `users` | Auth credentials | username, password (bcrypt), role |
| `departments` | Academic departments | name, code |
| `academic_years` | Academic cycles | name, currentYear |
| `semesters` | Semester mapping | name, academicYear, currentSemester |
| `sections` | Class subgroups | displayName, yearLabel, name, department |
| `subjects` | Course catalog | code, name, type (THEORY/LAB) |
| `staff` | Faculty directory | name, employeeId, department, roles, active |
| `students` | Student directory | name, registerNumber, section, active |
| `timetable_entries` | Class schedule | day, period, subject, staff, section, semester, isTest |
| `attendance_sessions` | Active/closed sessions | qrToken (8-digit), qrExpiresAt, status |
| `attendance_records` | Per-student marks | session, student, status (PRESENT/OD_PRESENT), markedAt |
| `assignments` / `tasks` / `tests` / `resources` | Study content | subject, section, due dates, durations |
| `student_task_completions` | Planner completion tracking | student, task, completedAt |

---

## 7. Technical Architecture

```
┌───────────────────────────┐
│  Vercel — React SPA       │   frontend/ (React 19 + TS + Vite 8)
└─────────────┬─────────────┘
              │  /api/* proxied via vercel.json rewrites
              ▼
┌───────────────────────────┐
│  Render — Spring Boot API │   backend/ (Java 25, JWT, Spring Data JPA)
└─────────────┬─────────────┘
              │  JDBC (sslmode=require)
              ▼
┌───────────────────────────┐
│  Neon — PostgreSQL 18     │   Serverless cloud database
└───────────────────────────┘
```

### Tech Stack
| Layer | Technology |
| --- | --- |
| Backend | Java 25, Spring Boot 4.0.7, Spring Security, JJWT 0.12.6, Spring Data JPA, Hibernate |
| Frontend | React 19, TypeScript 6, Vite 8, React Router 7, qrcode |
| Database | PostgreSQL 18 (Neon serverless) |
| Deployment | Vercel (frontend), Render (backend, Docker), Neon (DB) |

---

## 8. API Surface (High-Level)

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | Public | Authenticate & receive JWT |
| GET | `/api/auth/me` | Authenticated | Current user profile |
| GET | `/api/teacher/dashboard` | STAFF | Today's classes |
| POST | `/api/attendance/sessions` | STAFF | Start attendance session |
| POST | `/api/attendance/scan` | STUDENT | Submit token |
| POST | `/api/attendance/sessions/{id}/close` | STAFF | Close session |
| GET | `/api/student/planner` | STUDENT | Smart planner recommendations |
| GET | `/api/analytics/overview` | STAFF(Coordinator) | Section analytics |
| GET/POST/PUT/DELETE | `/api/admin/*` | ADMIN | Master data CRUD |
| GET/POST/PUT/DELETE | `/api/content/*` | STAFF | Assignments/tasks/tests/resources |

---

## 9. Milestones & Delivery Plan

| Milestone | Scope | Status |
| --- | --- | --- |
| M1 — Foundation | Spring Boot skeleton, JWT auth, user roles, master-data entities | ✅ Delivered |
| M2 — Attendance Core | Timetable, session generation, QR/token scan, attendance records | ✅ Delivered |
| M3 — Smart Planner | Free-period detection, recommendations, content hub | ✅ Delivered |
| M4 — Analytics | Section stats, shortage flags, monthly trends | ✅ Delivered |
| M5 — Admin & OD | Master data management, OD events | ✅ Delivered |
| M6 — Deployment | Vercel + Render + Neon, env config, docs | ✅ Delivered |

---

## 10. Demo Accounts

| Role | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `Admin@123` |
| Attendance Coordinator | `rajasekar` | `Raj@123` |
| Subject Staff | `pavithra` | `Pav@123` |
| Subject Staff | `arunkumar` | `Arun@123` |
| Subject Staff | `keerthana` | `Kee@123` |
| Student | `mohan23` | `Student@123` |

---

## 11. Future Scope

- Native mobile applications (iOS/Android).
- Biometric/facial verification as a secondary factor.
- LMS/ERP integrations (API-first expansion).
- Automated parent/guardian notifications for low attendance.
- Offline-first mode with background synchronization.
- AI-driven at-risk student early-warning system.

---

## 12. Release Acceptance Criteria

- [x] All four roles can log in with seeded demo accounts.
- [x] Teacher can start/close a session and render a valid QR code.
- [x] Student token entry marks attendance instantly and prevents duplicates.
- [x] Smart Planner returns recommendations based on free minutes.
- [x] Analytics flags students below the 75% threshold.
- [x] Full stack works end-to-end on production URLs.
