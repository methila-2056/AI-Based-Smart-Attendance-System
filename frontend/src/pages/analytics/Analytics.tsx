import { useEffect, useState } from 'react'
import { get } from '../../api/client'
import type { AnalyticsOverviewDto, MonthlyPointDto, StudentStatDto, SubjectStatDto } from '../../api/types'
import { Badge, SkeletonRows, StatCard } from '../../components/ui'
import { IconBarChart, IconClock, IconUsers } from '../../components/Icons'

type Tab = 'overview' | 'students' | 'subjects' | 'monthly'

export default function Analytics() {
  const [tab, setTab] = useState<Tab>('overview')
  const [overview, setOverview] = useState<AnalyticsOverviewDto | null>(null)
  const [students, setStudents] = useState<StudentStatDto[] | null>(null)
  const [subjects, setSubjects] = useState<SubjectStatDto[] | null>(null)
  const [monthly, setMonthly] = useState<MonthlyPointDto[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    get<AnalyticsOverviewDto>('/api/analytics/overview')
      .then(setOverview)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load attendance analytics'))
    get<StudentStatDto[]>('/api/analytics/students')
      .then(setStudents)
      .catch(() => undefined)
    get<SubjectStatDto[]>('/api/analytics/subjects')
      .then(setSubjects)
      .catch(() => undefined)
    get<MonthlyPointDto[]>('/api/analytics/monthly')
      .then(setMonthly)
      .catch(() => undefined)
  }, [])

  if (overview === null) {
    return error ? <div className="warning-banner">{error}</div> : <SkeletonRows rows={6} />
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Attendance Analytics & Reports</h1>
          <div className="page-subtitle">
            Attendance Coordinator Dashboard · All Assigned Academic Sections
            <Badge tone="primary" style={{ marginLeft: 8 }}>Coordinator View</Badge>
          </div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 20 }}>
        {(['overview', 'students', 'subjects', 'monthly'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`tab-btn${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'overview' ? 'Cumulative Overview' : t === 'students' ? 'Student Breakdowns' : t === 'subjects' ? 'Subject Performance' : '30-Day Trend Chart'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <StatCard
              label="Total Conducted Hours"
              value={`${overview.totalHours}h`}
              icon={<IconClock />}
              accent="info"
              desc="Cumulative teaching periods"
            />
            <StatCard
              label="Attended Hours"
              value={`${overview.presentHours}h`}
              icon={<IconUsers />}
              accent="success"
              desc="Verified classroom attendance"
            />
            <StatCard
              label="Approved OD Hours"
              value={`${overview.odHours}h`}
              icon={<IconClock />}
              accent="primary"
              desc="Official On-Duty attendance"
            />
            <StatCard
              label="Cumulative Attendance Rate"
              value={`${overview.overallPercent}%`}
              icon={<IconBarChart />}
              accent={overview.overallPercent >= 75 ? 'success' : 'danger'}
              desc="Regular + Approved OD Hours"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
            <BarCard title="Subject-wise Attendance Distribution" stats={overview.subjectStats.map((s) => ({ label: s.subjectLabel, present: s.present, od: s.od, total: s.total, percent: s.percent }))} />
            <BarCard title="Section Performance Comparison" stats={overview.sectionStats.map((s) => ({ label: s.sectionLabel, present: s.present, od: s.od, total: s.total, percent: s.percent }))} />
          </div>
        </>
      )}

      {tab === 'students' && students && (
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Register No.</th>
                  <th>Student Name</th>
                  <th>Section</th>
                  <th>Regular Present</th>
                  <th>OD Hours</th>
                  <th>Total Hours</th>
                  <th>Percentage</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.studentId}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{s.registerNumber}</td>
                    <td style={{ fontWeight: 650 }}>{s.name}</td>
                    <td>{s.sectionLabel}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{s.present} hrs</td>
                    <td>
                      <span className="badge badge-info" style={{ fontWeight: 700 }}>{s.od} hrs</span>
                    </td>
                    <td>{s.total} hrs</td>
                    <td style={{ fontWeight: 700 }}>{s.percent}%</td>
                    <td>
                      <Badge tone={pctTone(s.percent)}>{pctLabel(s.percent)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'subjects' && subjects && (
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Attendance Rate Visual Progress</th>
                  <th>Reg Present / OD / Total</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.subjectLabel}>
                    <td style={{ fontWeight: 650 }}>{s.subjectLabel}</td>
                    <td style={{ minWidth: 260 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(s.percent, 100)}%`,
                              background: s.percent >= 75 ? 'var(--success)' : 'var(--danger)',
                              borderRadius: 999,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      {s.present} Reg + <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{s.od} OD</span> / {s.total} hrs
                    </td>
                    <td>
                      <Badge tone={pctTone(s.percent)}>{s.percent}%</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'monthly' && monthly && <MonthlyChart points={monthly} />}
    </>
  )
}

function BarCard({ title, stats }: { title: string; stats: { label: string; present: number; total: number; percent: number }[] }) {
  const max = Math.max(...stats.map((s) => s.percent), 1)
  return (
    <div className="card card-pad">
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{title}</h3>
      {stats.length === 0 ? (
        <div className="empty-state" style={{ padding: '24px 8px' }}>No statistical data available yet.</div>
      ) : (
        stats.map((s) => (
          <div key={s.label} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ fontWeight: 650 }}>{s.label}</span>
              <span style={{ color: 'var(--muted)' }}>{s.present}/{s.total} hrs · <strong>{s.percent}%</strong></span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(s.percent / max) * 100}%`,
                  background: s.percent >= 75 ? 'var(--primary)' : 'var(--danger)',
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function MonthlyChart({ points }: { points: MonthlyPointDto[] }) {
  const max = Math.max(...points.map((p) => p.total), 1)
  return (
    <div className="card card-pad">
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Daily Attendance Trend (Last 30 Days)</h3>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Comparison of held teaching periods vs present student scans</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 200, overflowX: 'auto', paddingBottom: 10 }}>
        {points.map((p) => (
          <div key={p.date} style={{ flex: '1 1 0', minWidth: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div
              title={`${p.label}: ${p.present}/${p.total} (${p.percent}%)`}
              style={{
                width: '100%',
                maxWidth: 24,
                height: p.total === 0 ? 3 : Math.max((p.present / max) * 160, 4),
                borderRadius: 4,
                background: p.total === 0 ? 'var(--surface-2)' : p.percent >= 75 ? 'var(--primary)' : 'var(--warning)',
                transition: 'height 0.2s ease',
              }}
            />
            <div style={{ fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap', transform: 'rotate(-45deg)', transformOrigin: 'top left' }}>
              {p.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function pctTone(p: number): 'success' | 'warning' | 'danger' {
  if (p >= 85) return 'success'
  if (p >= 75) return 'warning'
  return 'danger'
}

function pctLabel(p: number): string {
  if (p >= 85) return 'Good'
  if (p >= 75) return 'Satisfactory'
  return 'Shortage Warning'
}
