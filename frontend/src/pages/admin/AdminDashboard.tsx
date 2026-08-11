import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../../api/client'
import type { AdminOverview } from '../../api/types'
import { Badge, SkeletonRows, StatCard } from '../../components/ui'
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBook,
  IconBuilding,
  IconClock,
  IconFolder,
  IconGraduation,
  IconLink,
  IconUsers,
} from '../../components/Icons'

export default function AdminDashboard() {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    get<AdminOverview>('/api/admin/overview')
      .then(setOverview)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load administrative overview'))
  }, [])

  if (overview === null) {
    return error ? <div className="warning-banner">{error}</div> : <SkeletonRows rows={4} />
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Good Morning, Admin</h1>
          <div className="page-subtitle">
            College Academic Management Portal · Odd Semester 2026–2027
            <Badge tone="success" dot pulse style={{ marginLeft: 6 }}>
              System Operational
            </Badge>
          </div>
        </div>
      </div>

      {overview.unassignedTimetableCount > 0 && (
        <div className="warning-banner">
          <IconAlertTriangle />
          <div style={{ flex: 1 }}>
            <strong>Action Required:</strong> {overview.unassignedTimetableCount} timetable {overview.unassignedTimetableCount === 1 ? 'entry has' : 'entries have'} no faculty assigned.
          </div>
          <Link to="/admin/timetable" className="btn btn-sm btn-primary">
            Resolve in Timetable <IconArrowRight />
          </Link>
        </div>
      )}

      <div className="stat-grid">
        <StatCard
          label="Total Students"
          value={overview.studentCount}
          icon={<IconGraduation />}
          accent="primary"
          desc="Enrolled across all sections"
        />
        <StatCard
          label="Faculty / Staff"
          value={overview.staffCount}
          icon={<IconUsers />}
          accent="info"
          desc="Active academic staff"
        />
        <StatCard
          label="Departments"
          value={overview.departmentCount}
          icon={<IconFolder />}
          accent="success"
          desc="Active academic units"
        />
        <StatCard
          label="Active Subjects"
          value={overview.subjectCount}
          icon={<IconBook />}
          accent="accent"
          desc="Current semester catalog"
        />
        <StatCard
          label="Class Sections"
          value={overview.sectionCount}
          icon={<IconBuilding />}
          accent="warning"
          desc="Current academic year"
        />
        <StatCard
          label="Timetable Slots"
          value={overview.timetableEntryCount}
          icon={<IconClock />}
          accent="primary"
          desc="Master schedule periods"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, alignItems: 'start' }}>
        <div className="card card-pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Quick Administrative Actions</h3>
            <span className="badge badge-muted">Admin Controls</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <Link to="/admin/staff" className="card card-pad card-hover" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div className="stat-icon" style={{ background: 'var(--accent-light)', color: 'var(--primary)' }}>
                  <IconUsers />
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Staff Directory</div>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
                Add new faculty, assign coordinator permissions, & manage staff status.
              </p>
            </Link>

            <Link to="/admin/staff-subjects" className="card card-pad card-hover" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div className="stat-icon" style={{ background: 'var(--info-light)', color: 'var(--info)' }}>
                  <IconLink />
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Staff–Subject Mapping</div>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
                Map faculty members to subjects and sections for the semester.
              </p>
            </Link>

            <Link to="/admin/timetable" className="card card-pad card-hover" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div className="stat-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
                  <IconClock />
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Timetable Manager</div>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
                Configure period-wise master schedules and monitor unassigned slots.
              </p>
            </Link>

            <Link to="/admin/students" className="card card-pad card-hover" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                  <IconGraduation />
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Student Directory</div>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
                Register students, assign section rosters, & manage login profiles.
              </p>
            </Link>
          </div>
        </div>

        <div className="card card-pad">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>System Status & Configuration</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>Current Academic Term</span>
              <span style={{ fontWeight: 650 }}>Odd Semester 2026–27</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>Unassigned Timetable Slots</span>
              <Badge tone={overview.unassignedTimetableCount > 0 ? 'warning' : 'success'}>
                {overview.unassignedTimetableCount} slots
              </Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>QR Attendance Engine</span>
              <Badge tone="success">Active (3 min token TTL)</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
              <span style={{ color: 'var(--muted)' }}>Smart Planner Engine</span>
              <Badge tone="primary">Enabled</Badge>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
