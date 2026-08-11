export type Role = 'ADMIN' | 'STAFF' | 'STUDENT'
export type StaffRoleType = 'SUBJECT_STAFF' | 'ATTENDANCE_COORDINATOR'
export type SubjectType = 'THEORY' | 'LAB'
export type Day = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
export type Designation = 'PRIMARY' | 'SECONDARY'

export interface UserInfo {
  id: number
  username: string
  role: Role
  displayName: string
  profileId?: number
  coordinator: boolean
}

export interface AuthResponse {
  token: string | null
  user: UserInfo
}

export interface LoginRequest {
  username: string
  password: string
}

export interface AdminOverview {
  staffCount: number
  studentCount: number
  departmentCount: number
  subjectCount: number
  sectionCount: number
  timetableEntryCount: number
  unassignedTimetableCount: number
}

export interface Department {
  id: number
  name: string
  code: string
}

export interface Subject {
  id: number
  code: string
  name: string
  departmentId?: number
  departmentName?: string
  type: SubjectType
}

export interface Section {
  id: number
  displayName: string
  yearLabel: string
  name: string
  departmentId: number
  departmentName: string
}

export interface AcademicYear {
  id: number
  name: string
  currentYear: boolean
}

export interface Semester {
  id: number
  name: string
  academicYearId: number
  academicYearName: string
  currentSemester: boolean
}

export interface Staff {
  id: number
  name: string
  employeeId: string
  email?: string
  phone?: string
  departmentId?: number
  departmentName?: string
  username: string
  roles: StaffRoleType[]
  active: boolean
}

export interface StaffSubjectAssignment {
  id: number
  staffId: number
  staffName: string
  subjectId: number
  subjectLabel: string
  sectionId: number
  sectionLabel: string
  semesterId: number
  semesterLabel: string
  designation: Designation
}

export interface TimetableEntry {
  id: number
  day: Day
  period: number
  subjectId: number
  subjectLabel: string
  staffId?: number
  staffName?: string
  secondaryStaffId?: number
  secondaryStaffName?: string
  sectionId: number
  sectionLabel: string
  semesterId: number
  semesterLabel: string
  isTest: boolean
  testTopic?: string
}

export interface Student {
  id: number
  name: string
  registerNumber: string
  email?: string
  phone?: string
  sectionId: number
  sectionLabel: string
  username: string
  active: boolean
}

// ------------------------------------------------------------------ Content

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW'
export type AttendanceSessionStatus = 'ACTIVE' | 'CLOSED' | 'ABSENT'
export type AttendanceRecordStatus = 'PRESENT' | 'OD_PRESENT'
export type OdStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

export interface OdPeriodInfo {
  period: number
  startTime: string
  endTime: string
  subjectLabel: string
  staffName: string
}

export interface OdRecordDto {
  id: number
  eventName: string
  date: string
  fromTime: string
  toTime: string
  departmentId: number
  departmentName: string
  yearLabel: string
  sectionId: number
  sectionLabel: string
  studentCount: number
  status: OdStatus
  createdAt: string
}

export interface OdRecordDetailDto {
  id: number
  eventName: string
  date: string
  fromTime: string
  toTime: string
  departmentId: number
  departmentName: string
  yearLabel: string
  sectionId: number
  sectionLabel: string
  status: OdStatus
  createdAt: string
  students: Student[]
  affectedPeriods: OdPeriodInfo[]
}

export interface StudentSelectDto {
  id: number
  name: string
  registerNumber: string
  sectionId: number
  sectionLabel: string
}

export interface CreateOdRequest {
  eventName: string
  date: string
  fromTime: string
  toTime: string
  departmentId: number
  yearLabel: string
  sectionId: number
  studentIds: number[]
}

export interface UpdateOdRequest {
  eventName: string
  date: string
  fromTime: string
  toTime: string
  departmentId: number
  yearLabel: string
  sectionId: number
  studentIds: number[]
}

export interface AssignmentDto {
  id: number
  subjectLabel: string
  sectionLabel: string
  title: string
  description?: string
  givenDate: string
  dueDate: string
  estimatedMinutes: number
}

export interface TaskDto {
  id: number
  subjectLabel: string
  sectionLabel: string
  title: string
  description?: string
  dueDate: string
  estimatedMinutes: number
  priority: TaskPriority
  completed: boolean
  completedAt?: string
}

export interface TestDto {
  id: number
  subjectLabel: string
  sectionLabel: string
  name: string
  unit?: string
  testDate: string
  durationMinutes: number
}

export interface ResourceDto {
  id: number
  subjectLabel: string
  sectionLabel: string
  title: string
  description?: string
  link: string
}

// ------------------------------------------------------------------ Student portal

export interface AttendanceSummaryDto {
  totalPeriods: number
  presentPeriods: number
  odPeriods: number
  absentPeriods: number
  percentage: number
}

export interface PeriodInfoDto {
  timetableEntryId: number
  period: number
  startTime: string
  endTime: string
  subjectLabel: string
  staffName: string
  status?: AttendanceSessionStatus
  test: boolean
  testTopic?: string
  freePeriod: boolean
  freeMinutes?: number
}

export interface TodayPeriodDto extends PeriodInfoDto {
  isCurrent: boolean
  isNext: boolean
}

export interface UpcomingItemDto {
  kind: 'assignment' | 'task' | 'test'
  id: number
  title: string
  subjectLabel: string
  due: string
  estimatedMinutes?: number
  completed: boolean
}

export interface StudentDashboardDto {
  name: string
  registerNumber: string
  sectionId: number
  sectionLabel: string
  today: string
  greeting: string
  currentPeriod: number
  summary: AttendanceSummaryDto
  current?: PeriodInfoDto
  next?: PeriodInfoDto
  todayPeriods: TodayPeriodDto[]
  upcomingTests: TestDto[]
  pendingItems: UpcomingItemDto[]
  freePeriod: boolean
  freePeriodMinutes?: number
}

export interface DayTimetableDto {
  day: Day
  periods: PeriodInfoDto[]
}

export interface StudentTimetableDto {
  days: DayTimetableDto[]
  periodMeta: string[]
}

export interface AttendanceRecordViewDto {
  id: number
  date: string
  dayLabel: string
  period: number
  subjectLabel: string
  sectionLabel: string
  status: AttendanceRecordStatus
}

export interface StudentSubjectDto {
  subjectId: number
  subjectLabel: string
  subjectCode: string
  attendancePresent: number
  attendanceOd: number
  attendanceAbsent: number
  attendanceTotal: number
  attendancePercent: number
  assignmentCount: number
  taskCount: number
  testCount: number
  resourceCount: number
  pendingTaskCount: number
}

export interface StudentSubjectDetailsDto {
  subjectId: number
  subjectLabel: string
  subjectCode: string
  attendancePresent: number
  attendanceOd: number
  attendanceAbsent: number
  attendanceTotal: number
  attendancePercent: number
  assignments: AssignmentDto[]
  tasks: TaskDto[]
  tests: TestDto[]
  resources: ResourceDto[]
}

export interface RecommendationDto {
  kind: 'assignment' | 'task' | 'test'
  id: number
  title: string
  subjectLabel: string
  due: string
  estimatedMinutes?: number
  explanation: string
}

export interface PlannerDto {
  freePeriod: boolean
  freeMinutes?: number
  statusLabel: string
  recommendations: RecommendationDto[]
  upcomingTests: TestDto[]
  pendingItems: UpcomingItemDto[]
}

export interface ScanRequest {
  qrToken: string
}

export interface ScanResultDto {
  success: boolean
  message: string
  record?: {
    id: number
    studentId: number
    studentName: string
    registerNumber: string
    status: AttendanceRecordStatus
    markedAt: string
  }
}

// ------------------------------------------------------------------ Analytics (attendance coordinator)

export interface SubjectStatDto {
  subjectLabel: string
  total: number
  present: number
  od: number
  absent: number
  percent: number
}

export interface SectionStatDto {
  sectionLabel: string
  total: number
  present: number
  od: number
  absent: number
  percent: number
}

export interface AnalyticsOverviewDto {
  totalStudents: number
  totalPeriods: number
  presentPeriods: number
  odPeriods: number
  absentPeriods: number
  totalHours: number
  presentHours: number
  odHours: number
  absentHours: number
  overallPercent: number
  subjectStats: SubjectStatDto[]
  sectionStats: SectionStatDto[]
}

export interface StudentStatDto {
  studentId: number
  name: string
  registerNumber: string
  sectionLabel: string
  total: number
  present: number
  od: number
  absent: number
  percent: number
}

export interface MonthlyPointDto {
  date: string
  label: string
  total: number
  present: number
  od: number
  absent: number
  percent: number
}

// ------------------------------------------------------------------ Teacher

export interface TeacherDashboardDto {
  name: string
  employeeId: string
  greeting: string
  today: string
  currentPeriod: number
  coordinator: boolean
  todayClasses: TodayClassDto[]
  openAssignments: number
  pendingTests: number
}

export interface TodayClassDto {
  timetableEntryId: number
  assignmentId?: number
  day: string
  period: number
  startTime: string
  endTime: string
  sectionId: number
  sectionLabel: string
  subjectId: number
  subjectLabel: string
  subjectCode: string
  isTest: boolean
  testTopic?: string
  status?: AttendanceSessionStatus
  sessionId?: number
  markedCount: number
  studentCount: number
  isCurrent: boolean
  isNext: boolean
}

export interface TeacherClassDto {
  assignmentId: number
  subjectId: number
  subjectLabel: string
  subjectCode: string
  sectionId: number
  sectionLabel: string
  semesterId: number
  semesterLabel: string
  designation: 'PRIMARY' | 'SECONDARY'
  assignmentCount: number
  taskCount: number
  testCount: number
  resourceCount: number
}

export interface SubjectHubDto {
  assignmentId: number
  subjectId: number
  subjectLabel: string
  subjectCode: string
  sectionId: number
  sectionLabel: string
  semesterId: number
  semesterLabel: string
  designation: 'PRIMARY' | 'SECONDARY'
  assignments: AssignmentDto[]
  tasks: TaskDto[]
  tests: TestDto[]
  resources: ResourceDto[]
}

export interface AttendanceRecordDto {
  id: number
  studentId: number
  studentName: string
  registerNumber: string
  status: AttendanceRecordStatus
  markedAt: string
}

export interface AttendanceSessionDto {
  id: number
  timetableEntryId: number
  assignmentId?: number
  sectionLabel: string
  subjectLabel: string
  subjectCode: string
  day: string
  period: number
  startTime: string
  endTime: string
  status: AttendanceSessionStatus
  qrToken: string
  qrExpiresAt: string
  startedAt: string
  closedAt?: string
  markedCount: number
  studentCount: number
  current: boolean
  records: AttendanceRecordDto[]
}
