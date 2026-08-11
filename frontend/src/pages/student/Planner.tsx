import { useEffect, useState } from 'react'
import { get, post } from '../../api/client'
import type { PlannerDto, RecommendationDto, UpcomingItemDto } from '../../api/types'
import { Badge, Button, EmptyState, SkeletonRows } from '../../components/ui'
import { useToast } from '../../components/Toasts'
import { IconCheck, IconClock, IconSparkles } from '../../components/Icons'

function fmt(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

function dueTone(due: string): 'danger' | 'warning' | 'info' {
  const days = (new Date(due + 'T00:00:00').getTime() - Date.now()) / 86400000
  if (days <= 2) return 'danger'
  if (days <= 5) return 'warning'
  return 'info'
}

export default function Planner() {
  const { toast } = useToast()
  const [data, setData] = useState<PlannerDto | null>(null)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'live' | 'dummy'>('live')
  const [showMdSpec, setShowMdSpec] = useState(false)

  const load = (currentMode: 'live' | 'dummy' = mode) => {
    const url = currentMode === 'dummy' ? '/api/student/planner/dummy' : '/api/student/planner'
    get<PlannerDto>(url)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load planner'))
  }

  useEffect(() => {
    load(mode)
  }, [mode])

  const handleModeChange = (newMode: 'live' | 'dummy') => {
    setMode(newMode)
  }

  if (data === null) {
    return error ? <div className="warning-banner">{error}</div> : <SkeletonRows rows={6} />
  }

  const complete = async (item: UpcomingItemDto) => {
    if (item.kind !== 'task') return
    try {
      await post(`/api/student/tasks/${item.id}/complete`)
      toast('Task marked as completed! Great progress! 🎉')
      load()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to complete task', 'error')
    }
  }

  return (
    <>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Today's Smart Study Plan</h1>
          <div className="page-subtitle">AI-driven free period analysis & intelligent task recommendations</div>
        </div>

        <div style={{ display: 'flex', gap: 8, background: 'var(--surface-2)', padding: 4, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <Button
            variant={mode === 'live' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => handleModeChange('live')}
          >
            ⚡ Live Timetable Mode
          </Button>
          <Button
            variant={mode === 'dummy' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => handleModeChange('dummy')}
          >
            📄 MD Sample Plan Mode (Section 6)
          </Button>
        </div>
      </div>

      {mode === 'dummy' && (
        <div
          className="card card-pad"
          style={{
            marginBottom: 20,
            background: 'color-mix(in srgb, var(--primary) 8%, var(--card))',
            borderColor: 'var(--primary)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--primary-dark)' }}>
                📋 Loaded Sample Study Plan from MD Specification
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                Displaying 50-minute free period recommendations derived from <code>smart_academic_companion_implementation_plan.md</code> (Section 6).
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMdSpec(!showMdSpec)}
            >
              {showMdSpec ? 'Hide MD Spec' : 'View Source Markdown Spec'}
            </Button>
          </div>

          {showMdSpec && (
            <div
              style={{
                marginTop: 14,
                padding: 14,
                background: 'var(--surface-3, #0f172a)',
                color: '#e2e8f0',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12.5,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
                border: '1px solid var(--border)',
                maxHeight: 280,
                overflowY: 'auto',
              }}
            >
              {`# Section 6: Smart Planner Priority Logic (smart_academic_companion_implementation_plan.md)

Priority logic:
1. Task/assignment with the nearest deadline
2. Upcoming test with the nearest date
3. Task that can realistically fit the free-period duration
4. Academic item directly related to the nearest upcoming assessment

Example:
Free period: 50 minutes
DBMS Assignment (Due: Tomorrow, Duration: 40 mins) -> Rank #1 (Fits free period & nearest deadline)
OS Test Revision (Date: Wednesday, Duration: 10 mins) -> Rank #2 (Uses remaining 10 minutes)
CN Task (Due: Friday, Duration: 30 mins) -> Rank #3 (Next priority item)`}
            </div>
          )}
        </div>
      )}

      {/* Free Period Availability Card */}
      <div
        className="card card-pad"
        style={{
          marginBottom: 24,
          background: data.freePeriod
            ? 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, var(--card)), var(--card))'
            : 'var(--card)',
          borderColor: data.freePeriod ? 'var(--accent)' : 'var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: data.freePeriod ? 'var(--accent-light)' : 'var(--surface-2)',
              color: data.freePeriod ? 'var(--primary)' : 'var(--muted)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <IconSparkles />
          </div>

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
              {data.freePeriod ? 'Free Period Window Detected' : 'Schedule Status'}
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 13.5, color: 'var(--text)' }}>
              {data.statusLabel}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 18, alignItems: 'start' }}>
        {/* Recommended Now Column */}
        <div className="card card-pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700 }}>Recommended Study Plan</h3>
            <Badge tone="primary">Ranked Priority</Badge>
          </div>

          {data.recommendations.length === 0 ? (
            <EmptyState
              icon={<IconClock />}
              text="No free period active right now"
              sub="When a faculty member marks a class as absent, your personalized recommendations will instantly prioritize items that fit your free time block."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {data.recommendations.map((r, i) => (
                <RecommendationCard
                  key={r.kind + r.id}
                  rec={r}
                  rank={i + 1}
                  onComplete={r.kind === 'task' ? () => complete({ kind: 'task', id: r.id, title: r.title, subjectLabel: r.subjectLabel, due: r.due, completed: false }) : undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pending Deadlines & Tests Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card card-pad">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Pending Deadlines</h3>
            {data.pendingItems.length === 0 ? (
              <EmptyState text="All caught up! No pending deadlines." />
            ) : (
              data.pendingItems.map((i) => (
                <div
                  key={i.kind + i.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 650, fontSize: 14 }}>{i.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      {i.kind === 'task' ? 'Task' : 'Assignment'} · {i.subjectLabel} · ~{i.estimatedMinutes ?? '—'} min
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <Badge tone={dueTone(i.due)}>Due {fmt(i.due)}</Badge>
                    {i.kind === 'task' ? (
                      <Button variant="ghost" size="sm" icon={<IconCheck />} onClick={() => complete(i)}>
                        Mark Done
                      </Button>
                    ) : (
                      <Badge tone="info">Assignment</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="card card-pad">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Upcoming Examinations</h3>
            {data.upcomingTests.length === 0 ? (
              <EmptyState text="No upcoming tests scheduled." />
            ) : (
              data.upcomingTests.map((t) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 650, fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{t.subjectLabel}</div>
                  </div>
                  <Badge tone="warning">{fmt(t.testDate)}</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function RecommendationCard({
  rec,
  rank,
  onComplete,
}: {
  rec: RecommendationDto
  rank: number
  onComplete?: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        padding: 16,
        background: 'var(--surface-2)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
          color: '#ffffff',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 800,
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        #{rank}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{rec.title}</div>
          {onComplete && (
            <Button variant="primary" size="sm" icon={<IconCheck />} onClick={onComplete}>
              Complete Task
            </Button>
          )}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>
          <Badge tone="primary" style={{ marginRight: 6 }}>
            {rec.kind.toUpperCase()}
          </Badge>
          {rec.subjectLabel} {rec.estimatedMinutes ? `· ~${rec.estimatedMinutes} min estimated` : ''}
        </div>

        <div
          style={{
            fontSize: 13,
            color: 'var(--text)',
            marginTop: 10,
            padding: '8px 12px',
            background: 'var(--surface)',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '3px solid var(--accent)',
          }}
        >
          💡 <strong>Why:</strong> {rec.explanation}
        </div>
      </div>
    </div>
  )
}
