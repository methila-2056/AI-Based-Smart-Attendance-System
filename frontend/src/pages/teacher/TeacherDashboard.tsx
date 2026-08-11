import { useCallback, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { get, post } from '../../api/client'
import type { AttendanceSessionDto, TeacherDashboardDto, TodayClassDto } from '../../api/types'
import { Badge, Button, ConfirmationDialog, Modal, SkeletonRows, StatCard, StatusBadge } from '../../components/ui'
import { useToast } from '../../components/Toasts'
import {
  IconAlertTriangle,
  IconBook,
  IconBuilding,
  IconClock,
  IconMaximize,
  IconQr,
  IconRefresh,
} from '../../components/Icons'

export default function TeacherDashboard() {
  const { toast } = useToast()
  const [dash, setDash] = useState<TeacherDashboardDto | null>(null)
  const [error, setError] = useState('')
  const [session, setSession] = useState<AttendanceSessionDto | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [fullscreenQr, setFullscreenQr] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [absentTarget, setAbsentTarget] = useState<TodayClassDto | null>(null)

  const load = useCallback(async () => {
    const d = await get<TeacherDashboardDto>('/api/teacher/dashboard')
    setDash(d)
  }, [])

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard'))
  }, [load])

  const openPanel = (s: AttendanceSessionDto) => {
    setSession(s)
    setModalOpen(true)
  }

  const renderQr = useCallback((s: AttendanceSessionDto) => {
    if (!s.qrToken) {
      setQrDataUrl('')
      return
    }
    QRCode.toDataURL(s.qrToken, { margin: 1, width: 340, errorCorrectionLevel: 'M' })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''))
  }, [])

  useEffect(() => {
    if (modalOpen && session) {
      renderQr(session)
      setCountdown(Math.max(0, Math.round((new Date(session.qrExpiresAt).getTime() - Date.now()) / 1000)))
    }
  }, [modalOpen, session, renderQr])

  useEffect(() => {
    const sid = session?.id
    const status = session?.status
    if (!modalOpen || !sid || status !== 'ACTIVE') return
    const tick = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1))
    }, 1000)
    const poll = setInterval(async () => {
      try {
        const s = await get<AttendanceSessionDto>(`/api/teacher/attendance/session/${sid}`)
        setSession(s)
      } catch {
        /* ignore transient poll errors */
      }
    }, 3000)
    return () => {
      clearInterval(tick)
      clearInterval(poll)
    }
  }, [modalOpen, session?.id, session?.status])

  const startOrOpen = async (c: TodayClassDto) => {
    setBusy(true)
    try {
      const s = c.sessionId
        ? await get<AttendanceSessionDto>(`/api/teacher/attendance/session/${c.sessionId}`)
        : await post<AttendanceSessionDto>('/api/teacher/attendance/start', { timetableEntryId: c.timetableEntryId })
      openPanel(s)
      if (!c.sessionId) toast(`Attendance session started for ${s.sectionLabel}`)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not start attendance session', 'error')
    } finally {
      setBusy(false)
    }
  }

  const refreshQr = async () => {
    if (!session) return
    setBusy(true)
    try {
      const s = await post<AttendanceSessionDto>(`/api/teacher/attendance/${session.id}/refresh`)
      setSession(s)
      toast('New QR token generated — 3 min validity')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not refresh QR token', 'error')
    } finally {
      setBusy(false)
    }
  }

  const closeSession = async () => {
    if (!session) return
    setBusy(true)
    try {
      const s = await post<AttendanceSessionDto>(`/api/teacher/attendance/${session.id}/close`)
      setSession(s)
      toast(`Session closed: ${s.markedCount}/${s.studentCount} students recorded`)
      await load()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not close session', 'error')
    } finally {
      setBusy(false)
    }
  }

  const confirmAbsent = async () => {
    if (!absentTarget) return
    setBusy(true)
    try {
      await post('/api/teacher/attendance/absent', { timetableEntryId: absentTarget.timetableEntryId })
      toast(`Marked class as absent — ${absentTarget.sectionLabel} ${absentTarget.subjectLabel}`)
      setAbsentTarget(null)
      await load()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not mark absent', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (dash === null) {
    return error ? <div className="warning-banner">{error}</div> : <SkeletonRows rows={6} />
  }

  const currentClass = dash.todayClasses.find((c) => c.isCurrent) || dash.todayClasses.find((c) => c.isNext)
  const absentMessage = absentTarget
    ? `Are you sure you want to mark period ${absentTarget.period} (${absentTarget.subjectLabel} - ${absentTarget.sectionLabel}) as absent? This will automatically trigger a Free Period notice for all students in this section.`
    : ''

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">
            {dash.greeting}, {dash.name}
          </h1>
          <div className="page-subtitle">
            ID: {dash.employeeId} · {formatDate(dash.today)}
            {dash.coordinator && (
              <Badge tone="primary" dot style={{ marginLeft: 8 }}>
                Attendance Coordinator
              </Badge>
            )}
          </div>
        </div>
        <Button variant="ghost" icon={<IconRefresh />} onClick={() => load().catch((e) => toast(e.message, 'error'))}>
          Sync Schedule
        </Button>
      </div>

      <div className="stat-grid">
        <StatCard
          label="Active Period"
          value={dash.currentPeriod === 0 ? 'Free' : `Period ${dash.currentPeriod}`}
          icon={<IconClock />}
          accent="primary"
          desc="Current academic schedule"
        />
        <StatCard
          label="Classes Today"
          value={dash.todayClasses.length}
          icon={<IconBuilding />}
          accent="info"
          desc="Scheduled teaching periods"
        />
        <StatCard
          label="Open Assignments"
          value={dash.openAssignments}
          icon={<IconBook />}
          accent="warning"
          desc="Active student assignments"
        />
        <StatCard
          label="Upcoming Tests"
          value={dash.pendingTests}
          icon={<IconAlertTriangle />}
          accent="danger"
          desc="Scheduled examinations"
        />
      </div>

      {/* Featured Current / Next Class Workspace Card */}
      <div className="card card-pad" style={{ marginBottom: 24, borderLeft: '4px solid var(--primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span className="badge badge-primary">
            {currentClass?.isCurrent ? '● CURRENT CLASS SESSION' : 'UPCOMING CLASS SESSION'}
          </span>
          {currentClass && <StatusBadge status={currentClass.status} />}
        </div>

        {currentClass ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px 0' }}>{currentClass.subjectLabel}</h2>
              <div style={{ fontSize: 14, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span>Section: <strong>{currentClass.sectionLabel}</strong></span>
                <span>•</span>
                <span>Period {currentClass.period} ({currentClass.startTime} – {currentClass.endTime})</span>
                {currentClass.isTest && (
                  <Badge tone="danger" style={{ marginLeft: 6 }}>
                    Test: {currentClass.testTopic}
                  </Badge>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Button variant="primary" size="lg" icon={<IconQr />} onClick={() => startOrOpen(currentClass)} loading={busy}>
                {currentClass.status === 'ACTIVE' ? 'Open Classroom QR Screen' : 'Generate Attendance QR'}
              </Button>
              {currentClass.status !== 'CLOSED' && (
                <Button variant="danger" size="lg" onClick={() => setAbsentTarget(currentClass)} disabled={busy}>
                  Mark Class Absent
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ padding: '12px 0', color: 'var(--muted)' }}>
            <h3 style={{ fontSize: 16, marginBottom: 4 }}>No class scheduled right now</h3>
            <p style={{ margin: 0, fontSize: 13 }}>You have no active teaching period at this moment. Review your schedule timeline below.</p>
          </div>
        )}
      </div>

      {/* Today's Schedule Timeline */}
      <div className="card card-pad">
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Today's Teaching Schedule Timeline</h3>
        {dash.todayClasses.length === 0 ? (
          <div className="empty-state">No teaching periods scheduled for today.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {dash.todayClasses.map((c) => (
              <div
                key={c.timetableEntryId}
                className={`card ${c.isCurrent ? 'card-hover' : ''}`}
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  borderColor: c.isCurrent ? 'var(--primary)' : undefined,
                  background: c.isCurrent ? 'color-mix(in srgb, var(--primary) 5%, var(--card))' : undefined,
                }}
              >
                <div style={{ minWidth: 80, textAlign: 'center', borderRight: '1px solid var(--border)', paddingRight: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: c.isCurrent ? 'var(--primary)' : 'var(--text)' }}>
                    P{c.period}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {c.startTime}–{c.endTime}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 10 }}>
                    {c.subjectLabel}
                    {c.isCurrent && <Badge tone="primary">Live Now</Badge>}
                    {c.isNext && !c.isCurrent && <Badge tone="info">Up Next</Badge>}
                    {c.isTest && <Badge tone="danger">Test · {c.testTopic}</Badge>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Section: {c.sectionLabel}</div>
                </div>

                <StatusBadge status={c.status} />

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Button variant="primary" size="sm" icon={<IconQr />} onClick={() => startOrOpen(c)} disabled={busy}>
                    {c.status === 'ACTIVE' ? 'Show QR' : 'Start Session'}
                  </Button>
                  {(c.status === null || c.status === 'ABSENT') && (
                    <Button variant="ghost" size="sm" onClick={() => setAbsentTarget(c)} disabled={busy}>
                      Mark Absent
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Classroom Projector-Friendly QR Modal */}
      <Modal
        open={modalOpen}
        title={session ? `${session.subjectLabel} · ${session.sectionLabel}` : 'Classroom Attendance'}
        onClose={() => setModalOpen(false)}
        maxWidth={fullscreenQr ? 960 : 580}
      >
        {session === null ? (
          <div className="empty-state">No attendance session loaded.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Period {session.period} ({session.startTime} – {session.endTime})</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  {session.status === 'ACTIVE' ? 'Students scan this QR using the mobile web app' : 'This attendance session has ended'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<IconMaximize />}
                  onClick={() => setFullscreenQr(!fullscreenQr)}
                >
                  {fullscreenQr ? 'Exit Fullscreen' : 'Projector View'}
                </Button>
                {session.status === 'ACTIVE' && <Badge tone="success" dot pulse>Live Session</Badge>}
              </div>
            </div>

            {/* High-Contrast Projector QR Display Box */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#FFFFFF',
                border: '2px solid var(--primary)',
                borderRadius: 16,
                padding: fullscreenQr ? 40 : 24,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              }}
            >
              {session.status === 'ACTIVE' && qrDataUrl ? (
                <>
                  <img
                    src={qrDataUrl}
                    alt="Classroom Attendance QR Code"
                    style={{
                      width: fullscreenQr ? 380 : 260,
                      height: fullscreenQr ? 380 : 260,
                      imageRendering: 'pixelated',
                    }}
                  />
                  <div style={{ marginTop: 14, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.06em' }}>
                      Classroom Token Code
                    </div>
                    <code
                      style={{
                        display: 'inline-block',
                        padding: '6px 16px',
                        background: '#F1F5F9',
                        color: '#0F172A',
                        borderRadius: 8,
                        fontSize: fullscreenQr ? 22 : 16,
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        marginTop: 4,
                      }}
                    >
                      {session.qrToken}
                    </code>
                  </div>
                </>
              ) : (
                <div style={{ padding: 40, color: 'var(--muted)', textAlign: 'center' }}>
                  <h3>Session Closed</h3>
                  <p>Attendance recording for this class has been finalized.</p>
                </div>
              )}
            </div>

            {session.status === 'ACTIVE' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: countdown <= 30 ? 'var(--danger)' : 'var(--muted)', fontWeight: 600 }}>
                  ⏱ Token auto-expires in: {formatCountdown(countdown)}
                </span>
                <span className="badge badge-primary" style={{ fontSize: 13 }}>
                  {session.markedCount} / {session.studentCount} Students Marked Present
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              {session.status === 'ACTIVE' && (
                <Button variant="ghost" icon={<IconRefresh />} onClick={refreshQr} disabled={busy}>
                  Issue New QR Token
                </Button>
              )}
              {session.status === 'ACTIVE' && (
                <Button variant="danger" onClick={closeSession} loading={busy}>
                  Finalize & Close Attendance
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Dialog for Marking Absent */}
      <ConfirmationDialog
        open={absentTarget !== null}
        title="Mark Scheduled Class as Absent?"
        message={absentMessage}
        confirmText="Confirm Absence"
        loading={busy}
        onConfirm={confirmAbsent}
        onCancel={() => setAbsentTarget(null)}
      />
    </>
  )
}

function formatDate(d: string): string {
  const date = new Date(d)
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
