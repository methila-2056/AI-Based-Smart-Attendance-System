import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get, post } from '../../api/client'
import type { StudentSubjectDetailsDto, StudentSubjectDto } from '../../api/types'
import { Badge, Button, Modal, SkeletonRows } from '../../components/ui'
import { useToast } from '../../components/Toasts'
import { IconAlertTriangle, IconBook, IconCheck, IconLink } from '../../components/Icons'

function pctTone(p: number): 'success' | 'warning' | 'danger' {
  if (p >= 85) return 'success'
  if (p >= 75) return 'warning'
  return 'danger'
}

export default function Subjects() {
  const { toast } = useToast()
  const [subjects, setSubjects] = useState<StudentSubjectDto[] | null>(null)
  const [error, setError] = useState('')

  const [activeSubject, setActiveSubject] = useState<StudentSubjectDto | null>(null)
  const [details, setDetails] = useState<StudentSubjectDetailsDto | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const loadSubjects = () => {
    get<StudentSubjectDto[]>('/api/student/subjects')
      .then(setSubjects)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load enrolled subjects'))
  }

  useEffect(loadSubjects, [])

  const openSubjectHub = async (s: StudentSubjectDto) => {
    setActiveSubject(s)
    setLoadingDetails(true)
    try {
      const data = await get<StudentSubjectDetailsDto>(`/api/student/subjects/${s.subjectId}/details`)
      setDetails(data)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load subject hub details', 'error')
    } finally {
      setLoadingDetails(false)
    }
  }

  const completeTask = async (taskId: number) => {
    try {
      await post(`/api/student/tasks/${taskId}/complete`)
      toast('Task marked as completed! 🎉', 'success')
      if (activeSubject) {
        openSubjectHub(activeSubject)
      }
      loadSubjects()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to complete task', 'error')
    }
  }

  if (subjects === null) {
    return error ? <div className="warning-banner">{error}</div> : <SkeletonRows rows={6} />
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">My Enrolled Subjects</h1>
          <div className="page-subtitle">Subject attendance tracking and academic course materials</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
        {subjects.map((s) => (
          <div key={s.subjectId} className="card card-pad card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px 0' }}>{s.subjectLabel}</h3>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                    Attendance: <strong>{s.attendancePresent}</strong> Reg + <strong>{s.attendanceOd || 0}</strong> OD / <strong>{s.attendanceTotal}</strong> periods
                  </div>
                </div>
                <Badge tone={pctTone(s.attendancePercent)} style={{ fontSize: 14, padding: '4px 12px' }}>
                  {s.attendancePercent}%
                </Badge>
              </div>

              {/* Attendance Progress Bar */}
              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: 'var(--surface-2)',
                  marginBottom: 16,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(s.attendancePercent, 100)}%`,
                    background: s.attendancePercent >= 75 ? 'var(--primary)' : 'var(--danger)',
                    borderRadius: 999,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <Badge tone="primary">📝 {s.assignmentCount} Assignments</Badge>
                <Badge tone="info">☑ {s.taskCount} Tasks</Badge>
                <Badge tone="warning">📋 {s.testCount} Tests</Badge>
                <Badge tone="muted">🔗 {s.resourceCount} Docs</Badge>
              </div>

              {s.pendingTaskCount > 0 && (
                <div style={{ fontSize: 12.5, color: 'var(--danger)', marginTop: 8, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <IconAlertTriangle style={{ width: 14, height: 14 }} />
                  <span>{s.pendingTaskCount} item{s.pendingTaskCount === 1 ? '' : 's'} pending completion</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <Button variant="primary" size="sm" style={{ flex: 1 }} icon={<IconBook />} onClick={() => openSubjectHub(s)}>
                View Course Hub
              </Button>
              <Link to="/student/attendance" className="btn btn-sm btn-secondary">
                Attendance
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Subject Hub Modal */}
      {activeSubject && (
        <Modal
          title={`Course Hub — ${activeSubject.subjectLabel}`}
          open={!!activeSubject}
          onClose={() => {
            setActiveSubject(null)
            setDetails(null)
          }}
        >
          {loadingDetails ? (
            <SkeletonRows rows={5} />
          ) : details ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Header Stats */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 14,
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--radius)',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>Course Attendance Status</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    {details.attendancePresent} / {details.attendanceTotal} periods ({details.attendancePercent}%)
                  </div>
                </div>
                <Badge tone={pctTone(details.attendancePercent)} style={{ fontSize: 14, padding: '6px 14px' }}>
                  {details.attendancePercent >= 75 ? 'On Track' : 'Low Attendance Alert'}
                </Badge>
              </div>

              {/* Assignments */}
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>📝 Course Assignments ({details.assignments.length})</h4>
                {details.assignments.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--muted)', padding: '10px 0' }}>No assignments published yet.</div>
                ) : (
                  details.assignments.map((a) => (
                    <div key={a.id} style={{ padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 650 }}>
                        <span>{a.title}</span>
                        <Badge tone="danger">Due {a.dueDate}</Badge>
                      </div>
                      {a.description && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{a.description}</div>}
                    </div>
                  ))
                )}
              </div>

              {/* Tasks */}
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>☑ Practice Tasks ({details.tasks.length})</h4>
                {details.tasks.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--muted)', padding: '10px 0' }}>No practice tasks assigned.</div>
                ) : (
                  details.tasks.map((t) => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 650, fontSize: 14 }}>{t.title}</div>
                        {t.description && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{t.description}</div>}
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>Due: {t.dueDate} · ~{t.estimatedMinutes} min</div>
                      </div>
                      {t.completed ? (
                        <Badge tone="success">Completed ✓</Badge>
                      ) : (
                        <Button variant="primary" size="sm" icon={<IconCheck />} onClick={() => completeTask(t.id)}>
                          Mark Done
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Tests */}
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>📋 Unit Examinations ({details.tests.length})</h4>
                {details.tests.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--muted)', padding: '10px 0' }}>No tests scheduled.</div>
                ) : (
                  details.tests.map((t) => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 650 }}>{t.name}</div>
                        {t.unit && <div style={{ fontSize: 12, color: 'var(--muted)' }}>Syllabus: {t.unit}</div>}
                      </div>
                      <Badge tone="warning">Date: {t.testDate}</Badge>
                    </div>
                  ))
                )}
              </div>

              {/* Resources */}
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>🔗 Shared Course Resources ({details.resources.length})</h4>
                {details.resources.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--muted)', padding: '10px 0' }}>No course documents shared yet.</div>
                ) : (
                  details.resources.map((r) => (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 650 }}>{r.title}</div>
                        {r.description && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{r.description}</div>}
                      </div>
                      <a href={r.link} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost" style={{ textDecoration: 'none' }}>
                        Open Link <IconLink style={{ width: 14, height: 14 }} />
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: 20, color: 'var(--muted)' }}>Failed to load subject details.</div>
          )}
        </Modal>
      )}
    </>
  )
}
