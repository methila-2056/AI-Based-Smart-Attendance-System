import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../../api/client'
import type { AttendanceRecordViewDto } from '../../api/types'
import { Badge, SkeletonRows, StatCard } from '../../components/ui'
import { IconBarChart, IconCheckCircle, IconClock, IconQr } from '../../components/Icons'

export default function MyAttendance() {
  const [records, setRecords] = useState<AttendanceRecordViewDto[] | null>(null)
  const [error, setError] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL')

  useEffect(() => {
    get<AttendanceRecordViewDto[]>('/api/student/attendance')
      .then(setRecords)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load attendance history'))
  }, [])

  if (records === null) {
    return error ? <div className="warning-banner">{error}</div> : <SkeletonRows rows={6} />
  }

  const subjectOptions = Array.from(new Set(records.map((r) => r.subjectLabel)))
  const filteredRecords = selectedSubject === 'ALL' ? records : records.filter((r) => r.subjectLabel === selectedSubject)

  const present = filteredRecords.filter((r) => r.status === 'PRESENT').length
  const od = filteredRecords.filter((r) => r.status === 'OD_PRESENT').length
  const total = filteredRecords.length
  const percent = total === 0 ? 0 : Math.round(((present + od) / total) * 1000) / 10

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">My Attendance History</h1>
          <div className="page-subtitle">Period-wise attendance verification & approved On-Duty (OD) records</div>
        </div>
        <Link to="/student/scanner" className="btn btn-primary">
          <IconQr /> Scan Class Attendance
        </Link>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <StatCard
          label="Cumulative Attendance"
          value={`${percent}%`}
          icon={<IconBarChart />}
          accent={percent >= 75 ? 'success' : 'danger'}
          desc="Regular + Approved OD Hours"
        />
        <StatCard
          label="Regular Attended"
          value={`${present} hrs`}
          icon={<IconCheckCircle />}
          accent="success"
          desc="Verified classroom QR scans"
        />
        <StatCard
          label="Approved OD Hours"
          value={`${od} hrs`}
          icon={<IconClock />}
          accent="info"
          desc="Official On-Duty granted"
        />
        <StatCard
          label="Total Conducted"
          value={`${total} hrs`}
          icon={<IconClock />}
          accent="primary"
          desc="Total recorded periods"
        />
      </div>

      <div className="card">
        <div className="card-pad" style={{ borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Attendance Log Records</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Filter by Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 13 }}
            >
              <option value="ALL">All Subjects ({records.length})</option>
              {subjectOptions.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Period</th>
                <th>Subject</th>
                <th>Section</th>
                <th>Attendance Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">No attendance records match the selected filter.</div>
                  </td>
                </tr>
              )}
              {filteredRecords.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 650 }}>
                      {new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.dayLabel}</div>
                  </td>
                  <td style={{ fontWeight: 700 }}>Period {r.period}</td>
                  <td style={{ fontWeight: 650 }}>{r.subjectLabel}</td>
                  <td>{r.sectionLabel}</td>
                  <td>
                    {r.status === 'OD_PRESENT' ? (
                      <span className="badge badge-info" style={{ fontWeight: 700 }}>OD – Present</span>
                    ) : (
                      <Badge tone="success" dot>Verified Present</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
