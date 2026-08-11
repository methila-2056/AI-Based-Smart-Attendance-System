import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { get } from '../../api/client'
import type { TeacherClassDto } from '../../api/types'
import { Badge, Button, EmptyState, SkeletonRows } from '../../components/ui'
import { IconArrowRight, IconBuilding } from '../../components/Icons'

export default function MyClasses() {
  const [classes, setClasses] = useState<TeacherClassDto[] | null>(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    get<TeacherClassDto[]>('/api/teacher/classes')
      .then(setClasses)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load assigned classes'))
  }, [])

  if (classes === null) {
    return error ? <div className="warning-banner">{error}</div> : <SkeletonRows rows={5} />
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">My Assigned Classes</h1>
          <div className="page-subtitle">Subjects and sections assigned to you for the current semester</div>
        </div>
      </div>

      {classes.length === 0 ? (
        <EmptyState
          icon={<IconBuilding />}
          text="No classes assigned yet"
          sub="Ask your college Admin to assign your subjects and sections for this semester."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {classes.map((c) => (
            <div
              key={c.assignmentId}
              className="card card-pad card-hover"
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              onClick={() => navigate(`/teacher/subject-hub/${c.assignmentId}`)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <Badge tone={c.designation === 'PRIMARY' ? 'primary' : 'info'}>
                    {c.designation === 'PRIMARY' ? 'Primary Faculty' : 'Secondary Faculty'}
                  </Badge>
                  <span className="badge badge-muted">{c.semesterLabel}</span>
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px 0' }}>{c.subjectLabel}</h3>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                  Section: <strong>{c.sectionLabel}</strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '14px 0' }}>
                  <div style={{ background: 'var(--surface-2)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>ASSIGNMENTS</div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{c.assignmentCount} active</div>
                  </div>
                  <div style={{ background: 'var(--surface-2)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>TASKS</div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{c.taskCount} assigned</div>
                  </div>
                  <div style={{ background: 'var(--surface-2)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>TESTS</div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{c.testCount} scheduled</div>
                  </div>
                  <div style={{ background: 'var(--surface-2)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>RESOURCES</div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{c.resourceCount} shared</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <Button variant="ghost" size="sm" icon={<IconArrowRight />}>
                  Manage Subject Hub
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
