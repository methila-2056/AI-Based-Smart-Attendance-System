import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getStoredTheme, setStoredTheme } from '../lib/theme'
import type { Theme } from '../lib/theme'
import {
  IconBarChart,
  IconBell,
  IconBook,
  IconBuilding,
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconFolder,
  IconGraduation,
  IconGrid,
  IconLink,
  IconLogOut,
  IconMoon,
  IconQr,
  IconSparkles,
  IconSun,
  IconUsers,
} from './Icons'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}

const ADMIN_NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'Configuration',
    items: [
      { to: '/admin', label: 'Dashboard', icon: <IconGrid /> },
      { to: '/admin/od', label: 'OD Management', icon: <IconCalendar /> },
      { to: '/admin/staff', label: 'Staff Management', icon: <IconUsers /> },
      { to: '/admin/departments', label: 'Departments', icon: <IconFolder /> },
      { to: '/admin/subjects', label: 'Subjects', icon: <IconBook /> },
      { to: '/admin/sections', label: 'Sections', icon: <IconBuilding /> },
      { to: '/admin/staff-subjects', label: 'Staff–Subject Mapping', icon: <IconLink /> },
      { to: '/admin/timetable', label: 'Timetable', icon: <IconClock /> },
      { to: '/admin/students', label: 'Students', icon: <IconGraduation /> },
    ],
  },
]

const TEACHER_NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'Teaching Workspaces',
    items: [
      { to: '/teacher', label: 'Dashboard', icon: <IconGrid /> },
      { to: '/teacher/my-classes', label: 'My Classes', icon: <IconBuilding /> },
    ],
  },
]

const STUDENT_NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'Student Workspace',
    items: [
      { to: '/student', label: 'Dashboard', icon: <IconGrid /> },
      { to: '/student/timetable', label: 'My Timetable', icon: <IconClock /> },
      { to: '/student/scanner', label: 'QR Attendance', icon: <IconQr /> },
      { to: '/student/attendance', label: 'My Attendance', icon: <IconBarChart /> },
      { to: '/student/planner', label: 'Smart Planner', icon: <IconSparkles /> },
      { to: '/student/subjects', label: 'My Subjects', icon: <IconBook /> },
    ],
  },
]

const TITLES: Record<string, string> = {
  '/admin': 'Admin Overview',
  '/admin/od': 'OD (On-Duty) Management',
  '/admin/staff': 'Staff Management',
  '/admin/departments': 'Academic Departments',
  '/admin/subjects': 'Subject Catalog',
  '/admin/sections': 'Class Sections',
  '/admin/staff-subjects': 'Staff–Subject Mapping',
  '/admin/timetable': 'Master Timetable',
  '/admin/students': 'Student Directory',
  '/teacher': 'Teacher Dashboard',
  '/teacher/my-classes': 'Assigned Classes',
  '/student': 'Student Dashboard',
  '/student/timetable': 'Weekly Timetable',
  '/student/scanner': 'QR Attendance Scanner',
  '/student/attendance': 'Attendance Records',
  '/student/planner': 'Smart Study Planner',
  '/student/subjects': 'Enrolled Subjects',
  '/teacher/analytics': 'Attendance Analytics',
}

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [theme, setTheme] = useState<Theme>(getStoredTheme())
  const [collapsed, setCollapsed] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  if (!user) return null

  const navForRole = (): typeof TEACHER_NAV => {
    if (user.role === 'ADMIN') return ADMIN_NAV
    if (user.role === 'STUDENT') return STUDENT_NAV
    return TEACHER_NAV.map((group) => ({
      ...group,
      items: user.coordinator
        ? [...group.items, { to: '/teacher/analytics', label: 'Analytics', icon: <IconBarChart /> }]
        : group.items,
    }))
  }

  const title =
    TITLES[location.pathname] ??
    (location.pathname.startsWith('/teacher/subject-hub') ? 'Subject Hub' : 'Smart Academic Companion')

  const pathParts = location.pathname.split('/').filter(Boolean)
  const breadcrumb = pathParts.map((part, i) => ({
    label: part.charAt(0).toUpperCase() + part.slice(1).replace('-', ' '),
    to: '/' + pathParts.slice(0, i + 1).join('/'),
  }))

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const initials = user.displayName
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setStoredTheme(next)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className={`app-shell ${collapsed ? 'collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-mark">SA</span>
            <div className="logo-text">
              <span>Smart Academic</span>
              <span className="logo-subtitle">Companion</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navForRole().map((group) => (
            <div key={group.section}>
              <div className="nav-group-title">{group.section}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to.split('/').length === 2}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="badge badge-primary">{user.role}</span>
          {!collapsed && <span>Odd Sem 2026–27</span>}
        </div>
      </aside>

      <div className="main">
        <header className="header">
          <div className="header-left">
            <div className="header-breadcrumb">
              <span>Academic Platform</span>
              {breadcrumb.map((b, i) => (
                <span key={b.to} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span className="sep">/</span>
                  <span style={{ color: i === breadcrumb.length - 1 ? 'var(--text)' : 'inherit', fontWeight: i === breadcrumb.length - 1 ? 600 : 400 }}>
                    {b.label}
                  </span>
                </span>
              ))}
            </div>
            <div className="header-title">{title}</div>
          </div>

          <div className="header-right">
            <div className="header-date">
              <IconCalendar style={{ width: 14, height: 14 }} />
              <span>{today}</span>
            </div>

            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
                title="Notifications"
              >
                <IconBell />
              </button>
              {showNotifications && (
                <div
                  className="card card-pad"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 320,
                    zIndex: 50,
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Notifications</span>
                    <button
                      type="button"
                      className="btn btn-xs btn-ghost"
                      onClick={() => setShowNotifications(false)}
                      style={{ fontSize: 11 }}
                    >
                      Close
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                    <NavLink
                      to={user.role === 'STUDENT' ? '/student/timetable' : '/admin/timetable'}
                      onClick={() => setShowNotifications(false)}
                      style={{ textDecoration: 'none', color: 'inherit', padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', display: 'block' }}
                    >
                      <div style={{ fontWeight: 600 }}>Timetable Schedule Updated</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Odd Semester classes are active</div>
                    </NavLink>
                    <NavLink
                      to={user.role === 'STUDENT' ? '/student/planner' : '/teacher'}
                      onClick={() => setShowNotifications(false)}
                      style={{ textDecoration: 'none', color: 'inherit', padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', display: 'block' }}
                    >
                      <div style={{ fontWeight: 600 }}>Smart Planner Analysis Active</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Free-period recommendations ready</div>
                    </NavLink>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <IconSun /> : <IconMoon />}
            </button>

            <div className="user-chip">
              <span className="avatar">{initials}</span>
              <span className="meta">
                <span className="name">{user.displayName}</span>
                <span className="role">{user.role.toLowerCase()}</span>
              </span>
            </div>

            <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout} title="Sign out">
              <IconLogOut />
              <span>Sign out</span>
            </button>
          </div>
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
