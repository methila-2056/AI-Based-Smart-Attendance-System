import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, homeForRole, useAuth } from './auth/AuthContext'
import { RequireAuth } from './auth/RequireAuth'
import { Layout } from './components/Layout'
import { ToastProvider } from './components/Toasts'
import Login from './pages/Login'

import AdminDashboard from './pages/admin/AdminDashboard'
import Departments from './pages/admin/Departments'
import OdManagement from './pages/admin/OdManagement'
import Sections from './pages/admin/Sections'
import Staff from './pages/admin/Staff'
import StaffSubjects from './pages/admin/StaffSubjects'
import Students from './pages/admin/Students'
import Subjects from './pages/admin/Subjects'
import Timetable from './pages/admin/Timetable'

import TeacherDashboard from './pages/teacher/TeacherDashboard'
import MyClasses from './pages/teacher/MyClasses'
import SubjectHub from './pages/teacher/SubjectHub'
import Analytics from './pages/analytics/Analytics'

import StudentDashboard from './pages/student/StudentDashboard'
import StudentTimetable from './pages/student/StudentTimetable'
import Scanner from './pages/student/Scanner'
import MyAttendance from './pages/student/MyAttendance'
import Planner from './pages/student/Planner'
import StudentSubjects from './pages/student/Subjects'

function Home() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
        <div className="spinner" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={homeForRole(user.role)} replace />
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />

            <Route path="/admin" element={<RequireAuth roles={['ADMIN']}><Layout /></RequireAuth>}>
              <Route index element={<AdminDashboard />} />
              <Route path="od" element={<OdManagement />} />
              <Route path="departments" element={<Departments />} />
              <Route path="subjects" element={<Subjects />} />
              <Route path="sections" element={<Sections />} />
              <Route path="staff" element={<Staff />} />
              <Route path="staff-subjects" element={<StaffSubjects />} />
              <Route path="timetable" element={<Timetable />} />
              <Route path="students" element={<Students />} />
            </Route>

            <Route path="/teacher" element={<RequireAuth roles={['STAFF']}><Layout /></RequireAuth>}>
              <Route index element={<TeacherDashboard />} />
              <Route path="my-classes" element={<MyClasses />} />
              <Route path="subject-hub/:assignmentId" element={<SubjectHub />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>

            <Route path="/student" element={<RequireAuth roles={['STUDENT']}><Layout /></RequireAuth>}>
              <Route index element={<StudentDashboard />} />
              <Route path="timetable" element={<StudentTimetable />} />
              <Route path="scanner" element={<Scanner />} />
              <Route path="attendance" element={<MyAttendance />} />
              <Route path="planner" element={<Planner />} />
              <Route path="subjects" element={<StudentSubjects />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
