import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../../api/client'
import type { AttendanceSessionStatus, PeriodInfoDto, StudentTimetableDto } from '../../api/types'
import { Badge, Modal, SkeletonRows } from '../../components/ui'
import { IconQr } from '../../components/Icons'

const STATUS_TONE: Record<AttendanceSessionStatus, 'success' | 'warning' | 'danger' | 'muted'> = {
  ACTIVE: 'success',
  CLOSED: 'warning',
  ABSENT: 'danger',
}

const STATUS_LABEL: Record<AttendanceSessionStatus, string> = {
  ACTIVE: 'QR Live',
  CLOSED: 'Marked',
  ABSENT: 'Free',
}

export default function StudentTimetable() {
  const [data, setData] = useState<StudentTimetableDto | null>(null)
  const [error, setError] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState<{ day: string; period: PeriodInfoDto } | null>(null)

  useEffect(() => {
    get<StudentTimetableDto>('/api/student/timetable')
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load timetable schedule'))
  }, [])

  if (data === null) {
    return error ? <div className="warning-banner">{error}</div> : <SkeletonRows rows={6} />
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Weekly Master Timetable</h1>
          <div className="page-subtitle">Period-wise weekly academic schedule for your section</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data-table" style={{ minWidth: 840 }}>
            <thead>
              <tr>
                <th style={{ width: 120 }}>Period</th>
                {data.days.map((d) => (
                  <th key={d.day} style={{ textAlign: 'center' }}>
                    {d.day.charAt(0) + d.day.slice(1).toLowerCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.periodMeta.map((meta, i) => {
                const period = i + 1
                return (
                  <tr key={period}>
                    <td style={{ background: 'var(--surface-2)' }}>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>P{period}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{meta.split('·')[1]}</div>
                    </td>

                    {data.days.map((d) => {
                      const p = d.periods.find((x) => x.period === period)
                      if (!p) {
                        return (
                          <td key={d.day} style={{ textAlign: 'center', background: 'var(--surface-2)', opacity: 0.4 }}>
                            <span style={{ fontSize: 12, color: 'var(--muted)' }}>— Free —</span>
                          </td>
                        )
                      }

                      return (
                        <td
                          key={d.day}
                          onClick={() => setSelectedPeriod({ day: d.day, period: p })}
                          style={{
                            padding: '12px',
                            cursor: 'pointer',
                            background: p.freePeriod
                              ? 'var(--danger-light)'
                              : p.test
                              ? 'var(--warning-light)'
                              : undefined,
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{p.subjectLabel}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{p.staffName}</div>

                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6, alignItems: 'center' }}>
                            {p.test && <Badge tone="warning">Test</Badge>}
                            {p.status && <Badge tone={STATUS_TONE[p.status]}>{STATUS_LABEL[p.status]}</Badge>}
                            {p.status === 'ACTIVE' && (
                              <Link
                                to="/student/scanner"
                                onClick={(e) => e.stopPropagation()}
                                className="btn btn-xs btn-primary"
                                style={{ padding: '2px 6px', fontSize: 11 }}
                              >
                                <IconQr /> Scan
                              </Link>
                            )}
                            {p.freePeriod && <Badge tone="danger">Free</Badge>}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card card-pad" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Period Timings & Schedule Reference</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {data.periodMeta.map((meta) => (
            <div key={meta} style={{ fontSize: 13, color: 'var(--muted)', background: 'var(--surface-2)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
              <strong>{meta.split('·')[0]}</strong>: {meta.split('·')[1]}
            </div>
          ))}
        </div>
      </div>

      {/* Period Inspection Modal */}
      {selectedPeriod && (
        <Modal
          title={`Period Details — ${selectedPeriod.day.charAt(0) + selectedPeriod.day.slice(1).toLowerCase()} P${selectedPeriod.period.period}`}
          open={!!selectedPeriod}
          onClose={() => setSelectedPeriod(null)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Subject</div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{selectedPeriod.period.subjectLabel}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Faculty Member</div>
                <div style={{ fontWeight: 600 }}>{selectedPeriod.period.staffName}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Time Slot</div>
                <div style={{ fontWeight: 600 }}>{selectedPeriod.period.startTime} – {selectedPeriod.period.endTime}</div>
              </div>
            </div>

            {selectedPeriod.period.test && (
              <div style={{ padding: 12, background: 'var(--warning-light)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontWeight: 700, color: 'var(--warning)' }}>📋 Unit Test Scheduled</div>
                {selectedPeriod.period.testTopic && (
                  <div style={{ fontSize: 13, marginTop: 4 }}>Topic: {selectedPeriod.period.testTopic}</div>
                )}
              </div>
            )}

            {selectedPeriod.period.status === 'ACTIVE' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <Badge tone="success">QR Attendance Session Live</Badge>
                <Link to="/student/scanner" className="btn btn-primary">
                  <IconQr /> Open QR Scanner
                </Link>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}
