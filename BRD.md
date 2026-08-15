# Business Requirements Document (BRD)

## AI-Based Smart Attendance System

| | |
| --- | --- |
| **Project Name** | AI-Based Smart Attendance System (Smart Academic Companion) |
| **Problem Statement** | IH-01 — Smart Curriculum Activity & Attendance App (Smart Education domain) |
| **Document Version** | 1.0 |
| **Prepared By** | Methila M |
| **Repository** | https://github.com/methila-2056/AI-Based-Smart-Attendance-System |
| **Live Demo** | https://ai-based-smart-attendance-system-omega.vercel.app |
| **Last Updated** | August 2026 |

---

## 1. Executive Summary

The **AI-Based Smart Attendance System** is a role-based academic platform designed to modernize classroom attendance and academic planning in higher-education institutions. It replaces manual, paper-based attendance marking with a secure, real-time **QR-code / token-based attendance flow**, automates timetable-driven session management, and introduces a **Smart Study Planner** that converts free periods into productive study time.

The system serves four primary user groups — **Administrators**, **Attendance Coordinators**, **Subject Staff**, and **Students** — through a single responsive web application deployed on a modern cloud stack.

---

## 2. Business Context

### 2.1 Background

Colleges typically rely on manual roll-call attendance, which suffers from:

- **Time inefficiency** — roll-call consumes 5–10 minutes of every lecture.
- **Proxy attendance** — students can answer for absent peers.
- **Manual data entry errors** — paper records must be transcribed into digital systems.
- **Delayed analytics** — attendance reports take days or weeks to produce.
- **No free-period optimization** — unutilized free hours are not converted into structured study time.

### 2.2 Business Opportunity

Digitizing attendance and academic planning creates measurable value:

- Recovers **lecture time** previously lost to roll-call.
- Eliminates proxy attendance through **time-boxed, randomized tokens**.
- Enables **real-time attendance visibility** for staff, coordinators, and students.
- Supports **regulatory compliance** (e.g., the 75% attendance requirement).
- Improves **student academic outcomes** by recommending study tasks during free periods.

---

## 3. Business Objectives

| # | Objective | Success Measure |
| --- | --- | --- |
| OBJ-1 | Eliminate manual roll-call | Attendance marking completed in under 1 minute per class |
| OBJ-2 | Eliminate proxy attendance | Token-based verification with 3-minute expiry per session |
| OBJ-3 | Provide real-time attendance visibility | Dashboards reflect marking instantly after a session closes |
| OBJ-4 | Enable regulatory compliance monitoring | Automatic flagging of students below the 75% attendance threshold |
| OBJ-5 | Convert free periods into study time | Smart Planner recommendations generated automatically |
| OBJ-6 | Centralize academic master data | Single source of truth for departments, sections, staff, students, subjects, and timetables |

---

## 4. Stakeholders

| Stakeholder | Role in System | Key Interests |
| --- | --- | --- |
| **Administrator** | Manages master data (departments, sections, staff, students, subjects, timetables), OD management | Full control, data accuracy |
| **Attendance Coordinator** | Monitors section-wise attendance analytics and shortage logs | Compliance, early intervention |
| **Subject Staff / Teacher** | Starts/ends attendance sessions, generates QR codes, manages subject content | Speed, reliability, ease of use |
| **Student** | Scans QR / enters token, views attendance, uses Smart Planner | Convenience, transparency |
| **Institution / Management** | Consumes reports and analytics | Governance, decision-making |
| **IT / DevOps** | Deploys and maintains the system on cloud infrastructure | Uptime, security, cost |

---

## 5. Scope

### 5.1 In Scope

- Period-wise QR/token attendance marking and recording.
- Fixed timetable management with staff and section mapping.
- Teacher class hub with "Start Session" and projector-ready QR generation.
- Student attendance scanner and personal attendance history.
- Attendance analytics with 75% threshold shortage detection.
- Smart Study Planner (free-period detection + task/test/assignment recommendations).
- Role-based access control with JWT authentication.
- Academic master data management (departments, sections, staff, students, subjects, semesters).
- On-duty (OD) event management.
- Cloud deployment (Vercel + Render + Neon).

### 5.2 Out of Scope (v1)

- Mobile native applications (web-responsive only).
- Integration with third-party LMS/ERP systems.
- Facial recognition or biometric attendance.
- Offline/sync mode for low-connectivity environments.
- Payment or fee-management features.

---

## 6. User Roles & Access Matrix

| Feature / Module | Admin | Coordinator | Teacher | Student |
| --- | :---: | :---: | :---: | :---: |
| Authentication (JWT login) | ✅ | ✅ | ✅ | ✅ |
| Department / Section management | ✅ | — | — | — |
| Staff & Student directory management | ✅ | — | — | — |
| Subject & Timetable management | ✅ | — | — | — |
| OD event management | ✅ | — | — | — |
| Start / close attendance sessions, QR generation | — | — | ✅ | — |
| Attendance scanner (enter token) | — | — | — | ✅ |
| My attendance history | — | — | — | ✅ |
| Smart Study Planner | — | — | — | ✅ |
| Attendance analytics & shortage logs | — | ✅ | — | — |
| Subject hub content (assignments, tasks, tests, resources) | — | — | ✅ | ✅ |

---

## 7. Functional Requirements (Business View)

| ID | Requirement | Benefit |
| --- | --- | --- |
| FR-1 | Teachers generate a randomized **8-digit token** for each class period | Prevents guessing and proxy attendance |
| FR-2 | Tokens expire after **3 minutes** | Time-boxes marking to the current period |
| FR-3 | Token is rendered as a **projector-ready QR code** | Fast, visual capture at scale |
| FR-4 | Students mark attendance by entering the token | Instant, verifiable attendance |
| FR-5 | System auto-detects **free periods** (e.g., teacher absent) | Frees staff time from manual tracking |
| FR-6 | Smart Planner recommends tasks/tests/assignments matching free time | Converts idle time into productivity |
| FR-7 | Coordinators see **section-wise analytics** with **<75% flags** | Enables compliance monitoring |
| FR-8 | All academic master data managed centrally by admins | Single source of truth |

---

## 8. Non-Functional Requirements (Business View)

| Category | Requirement |
| --- | --- |
| **Availability** | Hosted on cloud with auto-scaling PostgreSQL (Neon) and containerized backend (Render) |
| **Performance** | Attendance marking completes in under 1 second; dashboard loads in <3 seconds |
| **Security** | JWT-secured APIs, bcrypt password hashing, HTTPS only, session isolated per browser tab |
| **Scalability** | Stateless backend scales horizontally; serverless DB handles variable load |
| **Reliability** | Database schema auto-managed via Hibernate (`ddl-auto: update`) with seeded demo data |
| **Usability** | Role-based responsive UI with dark/light themes and a navy-indigo design system |
| **Compliance** | Supports attendance policies (e.g., 75% minimum attendance norms) |
| **Cost** | Runs on free tiers of Vercel, Render, and Neon for pilot/evaluation |

---

## 9. Business Process Flow

```
┌────────────────────────────────────────────────────────────────┐
│ TEACHER                               │ STUDENT                │
│                                      │                        │
│ 1. Login (JWT)                        │ 1. Login (JWT)         │
│ 2. View today's classes (timetable)   │ 2. Open Scanner        │
│ 3. "Start Session"                    │ 3. Enter 8-digit token │
│    → 8-digit token + QR (3 min)       │    (or scan QR)        │
│ 4. Projector shows QR                 │ 4. Verified → PRESENT  │
│ 5. Close session                      │ 5. View My Attendance  │
│                                       │ 6. Use Smart Planner   │
│ COORDINATOR                           │ ADMIN                  │
│ 1. View section analytics             │ 1. Manage master data  │
│ 2. Review <75% shortage logs          │ 2. Manage OD events    │
└────────────────────────────────────────────────────────────────┘
```

---

## 10. Constraints & Assumptions

### Constraints
- v1 targets web browsers (responsive), not native mobile apps.
- Demo accounts and seeded data are provided for evaluation.
- Attendance policy rules (e.g., 75%) are configurable at the application layer.

### Assumptions
- Institutions have reliable internet connectivity in classrooms.
- Each classroom has a projector or display for QR presentation.
- Staff and students have access to a browser-enabled device.
- Admin can maintain accurate master data (staff, students, timetables).

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Token sharing between students | Proxy attendance | 3-minute expiry + period-scoped sessions + activity logs |
| Network outage in classroom | Marking disruption | Students can retry after connectivity; staff can reopen sessions |
| Free-tier cold starts (Render) | First-load latency | Health checks, warm-up via scheduled pings |
| Data accuracy depends on timetable quality | Wrong analytics | Admin review workflow for timetable/master data |
| Device/browser inconsistency | UI issues | Modern browser support policy, responsive design |

---

## 12. Success Criteria / KPIs

| KPI | Target |
| --- | --- |
| Time to mark a full class present | < 60 seconds |
| Attendance data availability | Real-time after session close |
| Students below 75% detected | 100% automatically flagged |
| Smart Planner recommendations | Generated for every free period |
| Zero proxy attendance | Token uniqueness + expiry enforcement |

---

## 13. Approval

| Role | Name | Signature | Date |
| --- | --- | --- | --- |
| Product Owner | Methila M | | |
| Tech Lead | | | |
| Stakeholder | | | |
