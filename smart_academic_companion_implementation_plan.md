# Smart Academic Companion --- Hackathon Implementation Plan

> **Problem Statement:** IH-01 --- Smart Curriculum Activity &
> Attendance App\
> **Domain:** Smart Education\
> **Academic Context:** III Year CSE, Sections A & B, Odd Semester
> 2026--2027\
> **Purpose:** Build a professional, functional prototype that matches
> the real college workflow rather than a generic attendance
> application.

------------------------------------------------------------------------

## 1. Product Vision

The application is a role-based academic platform that combines:

-   Period/hour-wise QR attendance
-   Teacher and student dashboards
-   Fixed timetable management
-   Teacher absence → free-period detection
-   Subject-wise assignments, tasks, tests and resources
-   Personalized free-period planning
-   Attendance analytics for authorized attendance coordinators
-   Admin-controlled staff, subject and timetable configuration

### Core idea

> **Do not build only a QR attendance system. Build a Smart Academic
> Companion that uses the college timetable and teacher-provided
> academic data to turn available free periods into useful academic
> time.**

The official problem statement requires student login, teacher login, QR
attendance, attendance records, daily timetable, free-period detection,
personalized planner and attendance analytics.

------------------------------------------------------------------------

# 2. Real College Workflow to Preserve

The implementation must follow the actual workflow discussed for the
college.

## Attendance

-   Attendance is **period/hour-wise**, not a single daily attendance.
-   A normal period is approximately 50--55 minutes.
-   Each period has its own attendance session.
-   A three-hour laboratory block uses **one QR scan for the entire lab
    block**.
-   Teacher starts the attendance session and displays the QR through
    the classroom projector.
-   Teacher can manually close the attendance session.
-   Teacher can generate/refresh the QR during the scheduled period.
-   Students are normally not allowed to use phones in class, but
    attendance-time phone use is permitted with staff permission.
-   Students can otherwise misuse QR by giving a phone to a friend;
    lightweight face verification is therefore included as an anti-proxy
    layer.
-   Teacher and CR already know the students' faces, so the system does
    not need a complex institutional biometric system.
-   The system should not depend on college Wi-Fi.
-   Late attendance follows the existing college rule; prototype can
    expose a configurable late/grace window rather than hard-coding the
    policy.
-   Attendance data is verified by the CR/coordinator workflow.
-   Monthly attendance is based on total hours, attended hours and
    cumulative percentage.
-   Leave approval does not retroactively change attendance.

## Teacher absence and free period

-   Timetable is fixed for the semester.
-   If the scheduled teacher marks **Absent**, that scheduled period
    becomes a **Free Period**.
-   No substitute-teacher workflow is required in this prototype.
-   If a teacher has not started a class yet, the system should show
    **Session Not Started** rather than immediately declaring a free
    period.
-   Teacher has two explicit actions for a scheduled class:
    -   **Start Class / Generate QR**
    -   **Mark Absent**
-   Once **Mark Absent** is confirmed, the student side shows the period
    as a free period and activates the Smart Planner.

## Timetable

-   Timetable is maintained by Admin.
-   Staff, subject and class/section mapping are configured by Admin.
-   The system automatically derives a teacher's daily schedule from
    this mapping.
-   A teacher should only be able to generate QR for a class that is
    actually assigned to them for the current period.
-   Test periods on Monday, Wednesday and Friday are represented as
    scheduled TEST periods and can be configured with the relevant test
    subject/topic.

------------------------------------------------------------------------

# 3. User Roles

## Admin

Admin is the master configuration role.

### Responsibilities

-   Staff management
-   Department management
-   Year/section management
-   Subject management
-   Staff role assignment
-   Subject-staff allocation
-   Timetable management
-   Student master data
-   Academic-year/semester configuration

### Staff role flags

A staff member can have one or more permissions:

-   Subject Staff
-   Attendance Coordinator

Example:

**Rajasekar** - Department: CSE - Year: III - Sections: A, B - Role:
Attendance Coordinator

If a staff member has both roles, both capabilities appear in the same
Teacher portal.

------------------------------------------------------------------------

## Teacher

Teacher details are already stored by Admin.

Teacher does **not** repeatedly enter their own name, department or
subject.

### Teacher dashboard

Show:

-   Greeting and staff identity
-   Today's scheduled classes
-   Current/next class
-   Attendance-session status
-   Reminders
-   Pending academic-content updates

### Scheduled class actions

For an assigned current-period class:

-   Open Subject Hub
-   Start Class
-   Generate QR
-   Refresh QR
-   Close Attendance
-   Mark Absent

### Subject Hub

A teacher opens a specific assigned class/subject, for example:

> **III CSE A --- DBMS**

Sections:

-   Attendance
-   Assignments
-   Tasks
-   Tests
-   Resources

### Academic content

Teachers can create/update:

#### Assignment

-   Title
-   Description
-   Given date
-   Due date
-   Estimated duration
-   Optional resource attachment

#### Task

-   Title
-   Description
-   Due date
-   Estimated duration
-   Priority/status

#### Test

-   Test name
-   Subject/topic
-   Test date
-   Unit/topic
-   Duration

#### Resource

-   Title
-   Description
-   File or external link

------------------------------------------------------------------------

## Attendance Coordinator

No separate Coordinator module is required.

If a Teacher account has the Attendance Coordinator permission,
additional analytics appear automatically.

Example:

**Rajasekar → Teacher Login → Attendance Coordinator capabilities
enabled**

### Coordinator capabilities

-   Attendance overview
-   Student attendance details
-   Subject-wise attendance
-   Section-wise attendance
-   Monthly total hours
-   Monthly attended hours
-   Cumulative attendance percentage
-   Attendance shortage list
-   Daily/period attendance records
-   Attendance verification/edit workflow

Coordinator visibility must be restricted to assigned
year/department/sections.

------------------------------------------------------------------------

## Student

### Student dashboard

Show:

-   Student name and register number
-   Today's timetable
-   Current period
-   Next period
-   Attendance summary
-   Upcoming tests
-   Pending assignments/tasks
-   Free-period notification
-   Smart recommendation

### Student pages

-   Dashboard
-   QR Scanner
-   Timetable
-   My Attendance
-   My Subjects
-   Subject Details
-   Smart Planner

------------------------------------------------------------------------

# 4. Attendance Design

## Normal period flow

``` text
Teacher Login
    ↓
System identifies current scheduled class
    ↓
Teacher opens Subject Hub
    ↓
Start Class
    ↓
Dynamic QR generated
    ↓
QR displayed on projector
    ↓
Student scans QR
    ↓
Student identity/session validation
    ↓
Lightweight face verification
    ↓
Attendance entry created
    ↓
CR/Coordinator verification
    ↓
Teacher closes session
```

## QR security

Do not place sensitive student information directly in the QR.

Use a short-lived attendance token containing/referencing:

-   Attendance session ID
-   Secure random token
-   Class/section context
-   Subject context
-   Expiry
-   Session status

The backend must validate:

1.  Token exists
2.  Session is active
3.  Current time is within allowed session window
4.  Student belongs to the class/section
5.  Student has not already been marked
6.  Student identity verification succeeds

## Anti-proxy design

Face verification is intentionally lightweight and browser-side.

Recommended approach:

-   Registered student reference photo
-   Browser camera
-   Lightweight face detection/embedding model
-   Compare current face against the student's registered reference
-   Do not build a separate heavy ML server

The objective is not institutional biometric security; it is a practical
prototype mechanism to reduce obvious proxy attendance.

### Important fallback

If face verification fails:

-   Do not silently mark attendance.
-   Show verification failure.
-   Allow teacher/CR to manually verify if the prototype workflow needs
    an override.

------------------------------------------------------------------------

# 5. Free Period Logic

The system must distinguish three states:

### 1. Scheduled Class --- Not Started

``` text
Current period: DBMS
Teacher: Pavithra
Status: Session Not Started
```

Do not automatically call this a free period.

### 2. Active Class

Teacher selects:

**Start Class / Generate QR**

Status:

``` text
Class Active
QR Active
```

### 3. Teacher Absent

Teacher explicitly selects:

**Mark Absent**

Then:

``` text
Scheduled Class
        ↓
Teacher Absent
        ↓
Free Period
```

The student dashboard then shows:

> **Free Period --- 50 minutes available**

and activates the Smart Planner.

------------------------------------------------------------------------

# 6. Smart Planner

## Goal

The planner must not use arbitrary recommendations.

It should use actual academic information entered by subject staff.

### Inputs

-   Current time
-   Free-period duration
-   Student timetable
-   Pending assignments
-   Pending tasks
-   Upcoming tests
-   Test topics
-   Assignment/task deadlines
-   Estimated task duration
-   Subject resources

### No weak-subject model

Do **not** use a manually assigned "weak subject" score in the first
version.

The real college test timetable and teacher-entered academic deadlines
are more useful.

## Priority logic

Suggested priority:

1.  Task/assignment with the nearest deadline
2.  Upcoming test with the nearest date
3.  Task that can realistically fit the free-period duration
4.  Academic item directly related to the nearest upcoming assessment
5.  Longer-term tasks only when urgent items do not fit

### Example

Free period:

**50 minutes**

Academic data:

``` text
DBMS Assignment
Due: Tuesday
Duration: 40 minutes

OS Test
Date: Wednesday

CN Task
Due: Friday
Duration: 30 minutes
```

Recommendation:

> **Complete DBMS Assignment --- 40 minutes**

Remaining 10 minutes:

> **Quick DBMS revision --- 10 minutes**

## Recommendation explanation

Every recommendation should explain **why** it was selected.

Example:

> **Recommended because the assignment is due tomorrow and its estimated
> duration fits your 50-minute free period.**

This transparency is important for the hackathon demo.

------------------------------------------------------------------------

# 7. Test Timetable Integration

The college has recurring TEST periods on:

-   Monday
-   Wednesday
-   Friday

The system should store these as scheduled academic periods.

Admin can configure the test timetable.

Subject staff can enter the actual:

-   Test subject
-   Test topic/unit
-   Test date
-   Test details

The Smart Planner can then surface:

> **OS Test Tomorrow**

and recommend relevant OS revision during a suitable free period.

------------------------------------------------------------------------

# 8. Timetable and Staff Mapping

Admin is the source of truth.

Example:

``` text
Academic Year: 2026–2027
Semester: Odd
Year: III
Department: CSE
Section: A
Day: Thursday
Period: 5
Subject: DBMS/OS LAB
Staff: Arun Kumar + Keerthana
```

The system automatically derives teacher schedules.

For example:

> **III CSE A --- 5th Period --- DBMS --- Pavithra**

appears in Pavithra's Teacher Dashboard.

The QR button is enabled only when the logged-in teacher has an assigned
class for the current period.

------------------------------------------------------------------------

# 9. Timetable Reference

## Period timings

  Period   Time
  -------- --------------
  1        9:15--10:10
  2        10:10--11:05
  Break    11:05--11:20
  3        11:20--12:10
  4        12:10--1:00
  Lunch    1:00--1:45
  5        1:45--2:35
  6        2:35--3:25
  7        3:25--4:15

Use the supplied college timetable as the initial demo configuration for
III CSE A and III CSE B.

------------------------------------------------------------------------

# 10. Database Plan

Recommended core entities:

``` text
users
staff
students
departments
academic_years
semesters
sections
subjects
staff_roles
staff_subject_assignments
timetable_entries
attendance_sessions
attendance_records
student_face_profiles
assignments
tasks
tests
resources
student_task_status
```

## Important relationships

``` text
Department
   ↓
Year / Section
   ↓
Timetable Entry
   ├── Subject
   └── Assigned Staff
```

``` text
Staff
   ├── Subject Staff
   └── Attendance Coordinator
```

``` text
Subject
   ├── Assignments
   ├── Tasks
   ├── Tests
   └── Resources
```

``` text
Attendance Session
   ↓
Attendance Records
   ↓
CR / Coordinator Verification
```

``` text
Timetable + Academic Data
   ↓
Free Period
   ↓
Smart Planner
   ↓
Recommendation
   ↓
Student Task Completion
```

------------------------------------------------------------------------

# 11. Recommended Technical Stack

## Frontend

-   React
-   TypeScript
-   Vite
-   CSS / CSS Modules
-   React Router
-   Recharts
-   Browser QR scanner library

Avoid Tailwind for this project.

## Backend

-   Java
-   Spring Boot
-   Spring Web
-   Spring Security
-   JWT authentication
-   Spring Data JPA
-   Hibernate
-   Bean Validation

## Database

-   PostgreSQL

## Face verification

-   Lightweight browser-side face detection/embedding model
-   No separate Python ML server in the first version

## File resources

Use object/cloud storage for uploaded PDFs/resources in deployment.

## Deployment

-   Frontend: Vercel
-   Backend: Render or equivalent
-   PostgreSQL: managed PostgreSQL provider
-   Source code: public GitHub repository as required by the problem
    statement

------------------------------------------------------------------------

# 12. Backend Architecture

Use a layered Spring Boot architecture:

``` text
Controller
    ↓
Service
    ↓
Repository
    ↓
Entity
    ↓
PostgreSQL
```

Suggested modules:

``` text
auth
admin
staff
student
timetable
subject
attendance
planner
assignments
tasks
tests
resources
analytics
```

Do not put business logic directly inside controllers.

------------------------------------------------------------------------

# 13. Suggested API Groups

## Authentication

``` text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## Admin

``` text
GET    /api/admin/staff
POST   /api/admin/staff
PUT    /api/admin/staff/{id}
DELETE /api/admin/staff/{id}

GET    /api/admin/timetable
POST   /api/admin/timetable
PUT    /api/admin/timetable/{id}

POST   /api/admin/staff-subjects
```

## Teacher

``` text
GET  /api/teacher/dashboard
GET  /api/teacher/today
GET  /api/teacher/subject-hub/{assignmentId}

POST /api/teacher/attendance/start
POST /api/teacher/attendance/refresh-qr
POST /api/teacher/attendance/close
POST /api/teacher/attendance/absent
```

## Academic content

``` text
POST /api/assignments
PUT  /api/assignments/{id}

POST /api/tasks
PUT  /api/tasks/{id}

POST /api/tests
PUT  /api/tests/{id}

POST /api/resources
DELETE /api/resources/{id}
```

## Student

``` text
GET  /api/student/dashboard
GET  /api/student/timetable
GET  /api/student/attendance
GET  /api/student/subjects
GET  /api/student/planner
POST /api/student/attendance/scan
POST /api/student/tasks/{id}/complete
```

## Analytics

``` text
GET /api/analytics/overview
GET /api/analytics/students
GET /api/analytics/subjects
GET /api/analytics/monthly
```

All analytics endpoints must enforce role and scope restrictions.

------------------------------------------------------------------------

# 14. UI/UX Direction

The UI should look like a professional modern college ERP/productivity
platform, not a generic student project.

## Design personality

-   Professional
-   Clean
-   Institutional
-   Modern
-   Data-focused
-   Calm
-   Minimal visual noise

## Primary color system

Use a restrained navy/indigo system:

``` text
Primary:       #1E3A8A
Primary Dark:  #172554
Accent:        #4F46E5
Success:       #059669
Warning:       #D97706
Danger:        #DC2626
Info:          #0284C7

Light BG:      #F8FAFC
Surface:       #FFFFFF
Text:          #0F172A
Muted Text:    #64748B
Border:        #E2E8F0
```

Do not use many bright colors at once.

Use semantic colors only for:

-   Success
-   Warning
-   Error
-   Information

## Dark theme

``` text
Dark BG:       #0B1120
Dark Surface:  #111827
Dark Card:     #172033
Dark Border:   #263244
Dark Text:     #F8FAFC
Dark Muted:    #94A3B8
Primary:       #6366F1
Success:       #10B981
Warning:       #F59E0B
Danger:        #F87171
```

Dark mode must be a real theme, not just a black background.

Use CSS variables so the entire application switches consistently.

------------------------------------------------------------------------

# 15. UI Layout

## Desktop

Use:

``` text
┌──────────── Sidebar ───────────┬───────────────────────────┐
│ Logo                           │ Header                    │
│ Dashboard                      │                           │
│ Timetable                      │ Page content              │
│ Attendance                     │                           │
│ Subjects                       │                           │
│ Planner                        │                           │
│ Analytics                      │                           │
│ Settings                       │                           │
└────────────────────────────────┴───────────────────────────┘
```

## Header

Show:

-   Page title
-   Current date
-   Notifications
-   Theme toggle
-   User profile

## Cards

Use:

-   12--16px radius
-   Subtle border
-   Very light shadow in light mode
-   No excessive gradients
-   Consistent spacing

## Typography

Use a modern system font stack:

``` css
font-family:
  Inter,
  SF Pro Display,
  SF Pro Text,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

------------------------------------------------------------------------

# 16. Student Dashboard UI

Top section:

``` text
Good Morning, Mohan

Today
10 August 2026
```

Summary cards:

-   Attendance %
-   Today's Classes
-   Pending Tasks
-   Upcoming Tests

Main area:

### Today's Schedule

Show current period prominently.

### Smart Recommendation

Use a highlighted but professional card:

> **Recommended for your free period**
>
> Complete DBMS Normalization Assignment\
> Due tomorrow · 40 min\
> **Why:** nearest deadline and fits your available time.

### Upcoming

-   Tests
-   Assignment deadlines
-   Academic announcements

------------------------------------------------------------------------

# 17. Teacher Dashboard UI

Top:

``` text
Good Morning, Pavithra

Today's Schedule
```

Class cards:

``` text
11:20 – 12:10
III CSE A
DBMS

[ Open Subject Hub ]
```

Current class should have a clear state:

-   Ready
-   Attendance Active
-   Attendance Closed
-   Absent
-   Free Period

The **Generate QR** button should only appear/enabled when appropriate.

------------------------------------------------------------------------

# 18. Attendance QR Screen

The QR screen should be optimized for a projector.

Display:

``` text
DBMS
III CSE A
Period 5

[ LARGE QR ]

38 / 45 Students Scanned

Session Active
09:15 – 10:05

[ Refresh QR ] [ Close Attendance ]
```

Use large typography and high contrast.

Do not overcrowd the projector screen.

------------------------------------------------------------------------

# 19. Admin Dashboard UI

Show:

-   Total staff
-   Total students
-   Departments
-   Active timetable
-   Subject assignments
-   Current classes
-   Configuration warnings

Example warning:

> **3 timetable entries have no assigned staff.**

This is more useful than decorative statistics.

------------------------------------------------------------------------

# 20. Analytics UI

Use Recharts.

Recommended charts:

### Attendance trend

Line chart by date/month.

### Subject attendance

Bar chart.

### Section comparison

A/B comparison.

### Attendance distribution

Use a compact distribution visualization.

Always provide the actual numbers alongside charts.

Do not use charts merely for visual decoration.

------------------------------------------------------------------------

# 21. Professional UX Rules

### Forms

-   Clear labels
-   Helpful placeholders
-   Inline validation
-   Disabled states
-   Loading states
-   Success/error feedback
-   Confirmation for destructive actions

### Tables

-   Search
-   Filter
-   Sort
-   Pagination where needed
-   Sticky headers for long tables
-   Export where useful

### Empty states

Never show a blank page.

Example:

> **No pending assignments**
>
> You're all caught up.

### Error states

Example:

> **Attendance session expired**
>
> Ask the teacher to generate a new QR.

### Loading

Use skeleton loaders rather than large spinning loaders everywhere.

------------------------------------------------------------------------

# 22. Implementation Phases

## Phase 1 --- Project Foundation

-   Create React/Vite/TypeScript frontend
-   Create Spring Boot backend
-   Configure PostgreSQL
-   Configure environment variables
-   Configure Git repository
-   Establish frontend/backend API connection

## Phase 2 --- Authentication

-   Login UI
-   JWT
-   Spring Security
-   Role-based access
-   Staff/student/admin routing
-   Current-user API

## Phase 3 --- Admin

-   Staff CRUD
-   Roles
-   Departments
-   Years
-   Sections
-   Subjects
-   Staff-subject mapping
-   Timetable CRUD

## Phase 4 --- Teacher

-   Teacher dashboard
-   Automatically generated daily schedule
-   Current class detection
-   Subject Hub
-   Assignments
-   Tasks
-   Tests
-   Resources

## Phase 5 --- Attendance

-   Start attendance session
-   Dynamic QR generation
-   Projector-friendly QR screen
-   QR scanning
-   Session validation
-   Lightweight face verification
-   Attendance record creation
-   Teacher close session
-   Teacher mark absent
-   Free-period state

## Phase 6 --- Student

-   Student dashboard
-   Timetable
-   QR scanner
-   Attendance view
-   Subject view
-   Academic content
-   Free-period notification

## Phase 7 --- Smart Planner

-   Detect free period
-   Collect pending tasks
-   Collect upcoming tests
-   Compare deadlines
-   Check task duration
-   Generate recommendation
-   Explain recommendation
-   Track completion

## Phase 8 --- Coordinator Analytics

-   Role-based analytics
-   Period attendance
-   Monthly total hours
-   Attended hours
-   Cumulative percentage
-   Subject-wise reports
-   Student-wise reports
-   Section reports

## Phase 9 --- UI Polish

-   Professional color system
-   Dark theme
-   Responsive layout
-   Loading states
-   Empty states
-   Error states
-   Toasts
-   Accessibility
-   Projector QR screen
-   Mobile student scanner UI

## Phase 10 --- Demo & Deployment

-   Seed realistic demo data
-   Create demo accounts
-   Test all three roles
-   Deploy frontend
-   Deploy backend
-   Configure production PostgreSQL
-   Public GitHub repository
-   Prepare 5--7 minute demonstration

------------------------------------------------------------------------

# 23. Recommended Development Order

Do not build pages randomly.

Follow this order:

``` text
1. Database schema
       ↓
2. Admin master data
       ↓
3. Authentication
       ↓
4. Timetable + staff mapping
       ↓
5. Teacher dashboard
       ↓
6. Subject Hub
       ↓
7. QR attendance
       ↓
8. Student dashboard
       ↓
9. Free-period state
       ↓
10. Smart Planner
       ↓
11. Coordinator analytics
       ↓
12. UI polish
       ↓
13. Deployment
```

This order prevents broken dependencies.

------------------------------------------------------------------------

# 24. Demo Data

Use fictional/demo credentials.

## Admin

``` text
Username: admin
Password: Admin@123
```

## Attendance Coordinator

``` text
Username: rajasekar
Password: Raj@123
```

## Subject Staff

``` text
Username: pavithra
Password: Pav@123

Username: arunkumar
Password: Arun@123

Username: keerthana
Password: Kee@123
```

## Student

``` text
Username: mohan23
Password: Student@123
```

Use fictional student/staff data for the public GitHub/demo environment.

------------------------------------------------------------------------

# 25. Demo Scenario for Judges

The strongest 5--7 minute demo should follow one connected story.

## Scene 1 --- Admin

Show:

> Admin → Staff → Timetable → Staff/Subject mapping

Explain:

> "The timetable is the source of truth. It automatically determines
> which teacher can conduct which class."

## Scene 2 --- Teacher

Login as Pavithra.

Show:

> Today's Class → III CSE A → DBMS → Subject Hub

Start attendance.

Show the large projector QR.

## Scene 3 --- Student

Login as Mohan.

Scan QR.

Show:

> Identity verified → Attendance recorded.

## Scene 4 --- Teacher

Show live attendance count.

Close session.

## Scene 5 --- Teacher absence

Next scheduled period:

Teacher clicks:

> **Mark Absent**

Student dashboard immediately changes:

> **Free Period --- 50 minutes**

## Scene 6 --- Smart Planner

System checks:

-   Upcoming test
-   Pending assignment
-   Deadlines
-   Duration

Then displays:

> **Recommended: Complete DBMS Assignment --- due tomorrow --- 40 min**

This is the main "Smart Curriculum" moment.

## Scene 7 --- Coordinator

Login as Rajasekar.

Show:

-   Total hours
-   Attended hours
-   Cumulative attendance
-   Student-wise attendance
-   Monthly analytics

## Scene 8 --- Finish

Show:

> One system → Admin + Teacher + Student + Smart Planner + Attendance
> Analytics.

------------------------------------------------------------------------

# 26. Non-Goals for the First Version

Do not overbuild.

Avoid initially:

-   Complex AI/LLM recommendation systems
-   Heavy biometric infrastructure
-   College-wide ERP
-   Payroll
-   Fees
-   Hostel
-   Transport
-   Full LMS
-   Complex notification infrastructure
-   Wi-Fi-based attendance
-   Substitute teacher workflow
-   Complex mobile app

The prototype should remain lightweight and demonstrable.

------------------------------------------------------------------------

# 27. Acceptance Criteria

The project is ready for the hackathon demo when all of these work:

-   [ ] Admin can create/manage staff
-   [ ] Admin can assign roles
-   [ ] Admin can assign subjects
-   [ ] Admin can configure III CSE A/B timetable
-   [ ] Teacher sees only assigned classes
-   [ ] Teacher can open the correct Subject Hub
-   [ ] Teacher can add assignments/tasks/tests/resources
-   [ ] Teacher can start attendance for the scheduled class
-   [ ] QR is generated and displayed
-   [ ] Student can scan QR
-   [ ] Lightweight identity verification works
-   [ ] Duplicate attendance is blocked
-   [ ] Teacher can refresh/close QR session
-   [ ] Teacher can mark absent
-   [ ] Teacher absence creates a free period
-   [ ] Student sees the free period
-   [ ] Smart Planner selects a sensible academic activity
-   [ ] Recommendation includes a reason
-   [ ] Student can mark the task complete
-   [ ] Attendance Coordinator can view authorized analytics
-   [ ] Monthly attendance values are visible
-   [ ] Dark theme works throughout the application
-   [ ] UI is responsive
-   [ ] Application is deployed
-   [ ] Public GitHub repository is ready

------------------------------------------------------------------------

# 28. Final Product Structure

``` text
SMART ACADEMIC COMPANION

├── ADMIN
│   ├── Dashboard
│   ├── Staff
│   ├── Roles
│   ├── Departments
│   ├── Subjects
│   ├── Sections
│   ├── Staff-Subject Mapping
│   └── Timetable
│
├── TEACHER
│   ├── Dashboard
│   ├── My Classes
│   ├── Subject Hub
│   │   ├── Attendance
│   │   ├── Assignments
│   │   ├── Tasks
│   │   ├── Tests
│   │   └── Resources
│   └── Analytics
│       └── Only for authorized coordinators
│
└── STUDENT
    ├── Dashboard
    ├── QR Scanner
    ├── Timetable
    ├── Attendance
    ├── Subjects
    ├── Smart Planner
    └── Academic Tasks
```

------------------------------------------------------------------------

# 29. Design Principle

The most important implementation principle is:

> **Build the actual college workflow first, then add intelligence where
> it provides measurable value.**

The project should feel like a professional academic product:

**Reliable attendance + accurate timetable mapping + useful academic
planning + clean analytics + polished UI.**

The Smart Planner is the differentiator, while QR attendance is the
operational foundation.
