import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../../api/client'
import type { AttendanceSessionStatus, PeriodInfoDto, StudentDashboardDto } from '../../api/types'
import { Badge, SkeletonRows, StatCard, StatusBadge } from '../../components/ui'
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBarChart,
  IconBook,
  IconClock,
  IconQr,
  IconSparkles,
} from '../../components/Icons'

const STATUS_TONE: Record<AttendanceSessionStatus, 'success' | 'warning' | 'danger' | 'muted'> = {
  ACTIVE: 'success',
  CLOSED: 'warning',
  ABSENT: 'danger',
}

const STATUS_LABEL: Record<AttendanceSessionStatus, string> = {
  ACTIVE: 'QR Live',
  CLOSED: 'Completed',
  ABSENT: 'Free Period',
}

function fmt(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

export default function StudentDashboard() {
  const [data, setData] = useState<StudentDashboardDto | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    get<StudentDashboardDto>('/api/student/dashboard')
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load student dashboard'))
  }, [])

  if (data === null) {
    return error ? <div className="warning-banner">{error}</div> : <SkeletonRows rows={6} />
  }

  const { summary, current, next } = data

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">
            {data.greeting}, {data.name.split(' ')[0]}
          </h1>
          <div className="page-subtitle">
            Reg. No: <strong>{data.registerNumber}</strong> · Section: <strong>{data.sectionLabel}</strong>
          </div>
        </div>
        <Link to="/student/scanner" className="btn btn-primary" style={{ padding: '10px 18px' }}>
          <IconQr /> Scan Class Attendance
        </Link>
      </div>

      {/* Free Period Encouraging Notification Banner */}
      {data.freePeriod && (
        <div className="info-banner" style={{ background: 'color-mix(in srgb, var(--accent) 12%, var(--card))', borderColor: 'var(--accent)' }}>
          <IconSparkles style={{ color: 'var(--accent)', width: 20, height: 20 }} />
          <div style={{ flex: 1, color: 'var(--text)' }}>
            <strong>Free Period Detected ({data.freePeriodMinutes} min available):</strong> Your scheduled faculty is unavailable. Make optimal use of this period with your Smart Study Plan.
          </div>
          <Link to="/student/planner" className="btn btn-sm btn-primary">
            Open Smart Planner <IconArrowRight />
          </Link>
        </div>
      )}

      {/* KPI Stats Row */}
      <div className="stat-grid">
        <Link to="/student/attendance" style={{ textDecoration: 'none', color: 'inherit' }}>
          <StatCard
            label="Cumulative Attendance"
            value={`${summary.percentage}%`}
            icon={<IconBarChart />}
            accent={summary.percentage >= 75 ? 'success' : 'danger'}
            desc={`${summary.presentPeriods} of ${summary.totalPeriods} periods attended`}
          />
        </Link>
        <Link to="/student/timetable" style={{ textDecoration: 'none', color: 'inherit' }}>
          <StatCard
            label="Classes Today"
            value={data.todayPeriods.length}
            icon={<IconClock />}
            accent="primary"
            desc="Scheduled timetable periods"
          />
        </Link>
        <Link to="/student/planner" style={{ textDecoration: 'none', color: 'inherit' }}>
          <StatCard
            label="Pending Tasks & Work"
            value={data.pendingItems.length}
            icon={<IconBook />}
            accent="warning"
            desc="Assignments and practice items"
          />
        </Link>
        <Link to="/student/planner" style={{ textDecoration: 'none', color: 'inherit' }}>
          <StatCard
            label="Upcoming Tests"
            value={data.upcomingTests.length}
            icon={<IconAlertTriangle />}
            accent="danger"
            desc="Scheduled unit examinations"
          />
        </Link>
      </div>

      {/* Smart Planner Recommendation Card */}
      <div
        className="card card-pad"
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 10%, var(--card)), var(--card))',
          border: '1px solid color-mix(in srgb, var(--accent) 30%, var(--border))',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconSparkles style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)' }}>
              SMART RECOMMENDATION FOR FREE PERIOD
            </span>
          </div>
          <Badge tone="primary">AI Smart Planner</Badge>
        </div>

        {data.pendingItems.length > 0 ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px 0' }}>{data.pendingItems[0].title}</h3>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                {data.pendingItems[0].subjectLabel} · Due Date: <strong>{fmt(data.pendingItems[0].due)}</strong>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 8, background: 'var(--surface-2)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', width: 'fit-content' }}>
                💡 <strong>Why recommended:</strong> Nearest approaching deadline + perfectly matches your available free period time block.
              </div>
            </div>

            <Link to="/student/planner" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
              View Complete Smart Plan <IconArrowRight />
            </Link>
          </div>
        ) : (
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>
            All academic assignments and practice tasks are up to date! Great work. 🎉
          </div>
        )}
      </div>

      {/* Live & Next Period Banner Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
        {current && <PeriodHighlightCard title={`Current Period (P${current.period})`} period={current} highlight />}
        {next && <PeriodHighlightCard title={`Next Period (P${next.period})`} period={next} />}
      </div>

      {/* Timetable & Deadlines Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, alignItems: 'start' }}>
        <div className="card">
          <div className="card-pad" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Today's Timetable Schedule</h3>
            <Link to="/student/timetable" className="btn btn-xs btn-ghost">Full Timetable →</Link>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Time Slot</th>
                  <th>Subject</th>
                  <th>Faculty</th>
                  <th>Session Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.todayPeriods.map((p) => (
                  <tr key={p.timetableEntryId} style={{ background: p.isCurrent ? 'color-mix(in srgb, var(--primary) 6%, var(--card))' : undefined }}>
                    <td style={{ fontWeight: 700 }}>P{p.period}</td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {p.startTime} – {p.endTime}
                    </td>
                    <td>
                      <span style={{ fontWeight: 650 }}>{p.subjectLabel}</span>
                      {p.test && <Badge tone="warning" style={{ marginLeft: 6 }}>Test</Badge>}
                    </td>
                    <td>{p.staffName}</td>
                    <td>
                      {p.isCurrent ? (
                        <Badge tone="primary" dot pulse>Live Now</Badge>
                      ) : p.status ? (
                        <Badge tone={STATUS_TONE[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                      ) : (
                        <Badge tone="muted">Upcoming</Badge>
                      )}
                    </td>
                    <td>
                      {p.status === 'ACTIVE' || p.isCurrent ? (
                        <Link to="/student/scanner" className="btn btn-xs btn-primary">
                          <IconQr /> Scan QR
                        </Link>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Upcoming Examinations</h3>
              <Link to="/student/planner" className="btn btn-xs btn-ghost">Study Plan →</Link>
            </div>
            {data.upcomingTests.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 8px' }}>No upcoming tests scheduled.</div>
            ) : (
              data.upcomingTests.map((t) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 650 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{t.subjectLabel}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge tone="warning">{fmt(t.testDate)}</Badge>
                    <Link to="/student/planner" className="btn btn-xs btn-secondary">Plan</Link>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="card card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Academic Deadlines</h3>
              <Link to="/student/planner" className="btn btn-xs btn-ghost">All Items →</Link>
            </div>
            {data.pendingItems.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 8px' }}>All caught up! No pending deadlines.</div>
            ) : (
              data.pendingItems.slice(0, 4).map((i) => (
                <div key={i.kind + i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 650 }}>{i.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{i.subjectLabel}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge tone="danger">{fmt(i.due)}</Badge>
                    {i.kind === 'task' && (
                      <Link to="/student/planner" className="btn btn-xs btn-primary">Do Task</Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function PeriodHighlightCard({ title, period, highlight }: { title: string; period: PeriodInfoDto; highlight?: boolean }) {
  return (
    <div
      className="card card-pad"
      style={{
        borderColor: highlight ? 'var(--primary)' : undefined,
        boxShadow: highlight ? 'var(--shadow-md)' : undefined,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>
          {title}
        </span>
        {period.status && <StatusBadge status={period.status} />}
      </div>

      <div style={{ fontSize: 18, fontWeight: 700, margin: '4px 0' }}>{period.subjectLabel}</div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
        {period.startTime} – {period.endTime} · Faculty: {period.staffName}
      </div>

      {period.status === 'ACTIVE' && (
        <Link to="/student/scanner" className="btn btn-sm btn-primary" style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <IconQr /> Scan Class Attendance
        </Link>
      )}

      {period.freePeriod && (
        <div style={{ marginTop: 10 }}>
          <Badge tone="danger">Free Period — {period.freeMinutes} min available</Badge>
        </div>
      )}
    </div>
  )
}
