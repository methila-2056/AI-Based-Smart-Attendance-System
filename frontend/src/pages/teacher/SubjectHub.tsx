import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { del, get, post, put } from '../../api/client'
import type { AssignmentDto, ResourceDto, SubjectHubDto, TaskDto, TestDto } from '../../api/types'
import { DataTable } from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import { Badge, Button, ConfirmationDialog, Modal, SkeletonRows } from '../../components/ui'
import { useToast } from '../../components/Toasts'
import {
  IconChevronLeft,
  IconEdit,
  IconPlus,
  IconQr,
  IconTrash,
} from '../../components/Icons'

type TabKind = 'overview' | 'attendance' | 'assignments' | 'tasks' | 'tests' | 'resources'

interface Field {
  name: string
  label: string
  type: 'text' | 'textarea' | 'date' | 'number' | 'select'
  required?: boolean
  fullWidth?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
}

type FormValues = Record<string, unknown>

const TABS: { kind: TabKind; label: string }[] = [
  { kind: 'overview', label: 'Overview' },
  { kind: 'attendance', label: 'Attendance' },
  { kind: 'assignments', label: 'Assignments' },
  { kind: 'tasks', label: 'Tasks' },
  { kind: 'tests', label: 'Tests' },
  { kind: 'resources', label: 'Resources' },
]

const PRIORITY_OPTIONS = [
  { value: 'HIGH', label: 'High Priority' },
  { value: 'MEDIUM', label: 'Medium Priority' },
  { value: 'LOW', label: 'Low Priority' },
]

const ASSIGNMENT_FIELDS: Field[] = [
  { name: 'title', label: 'Assignment Title', type: 'text', required: true },
  { name: 'description', label: 'Instructions / Description', type: 'textarea', fullWidth: true, placeholder: 'What do students need to submit?' },
  { name: 'givenDate', label: 'Given Date', type: 'date', required: true },
  { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
  { name: 'estimatedMinutes', label: 'Estimated Time (Minutes)', type: 'number', required: true },
]

const TASK_FIELDS: Field[] = [
  { name: 'title', label: 'Task Title', type: 'text', required: true },
  { name: 'description', label: 'Task Description', type: 'textarea', fullWidth: true, placeholder: 'What practice items should be completed?' },
  { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
  { name: 'estimatedMinutes', label: 'Estimated Time (Minutes)', type: 'number', required: true },
  { name: 'priority', label: 'Priority Level', type: 'select', options: PRIORITY_OPTIONS },
]

const TEST_FIELDS: Field[] = [
  { name: 'name', label: 'Test Title / Unit Name', type: 'text', required: true },
  { name: 'unit', label: 'Unit / Syllabus Scope', type: 'text', placeholder: 'e.g. Unit 3 — Normalization' },
  { name: 'testDate', label: 'Scheduled Date', type: 'date', required: true },
  { name: 'durationMinutes', label: 'Duration (Minutes)', type: 'number', required: true },
]

const RESOURCE_FIELDS: Field[] = [
  { name: 'title', label: 'Resource Title', type: 'text', required: true },
  { name: 'description', label: 'Summary Description', type: 'textarea', fullWidth: true },
  { name: 'link', label: 'Document / Video URL', type: 'text', placeholder: 'https://...' },
]

const fieldsFor = (kind: TabKind): Field[] => {
  if (kind === 'assignments') return ASSIGNMENT_FIELDS
  if (kind === 'tasks') return TASK_FIELDS
  if (kind === 'tests') return TEST_FIELDS
  if (kind === 'resources') return RESOURCE_FIELDS
  return []
}

const defaultsFor = (kind: TabKind): FormValues => {
  if (kind === 'assignments') return { title: '', description: '', givenDate: '', dueDate: '', estimatedMinutes: 30 }
  if (kind === 'tasks') return { title: '', description: '', dueDate: '', estimatedMinutes: 30, priority: 'MEDIUM' }
  if (kind === 'tests') return { name: '', unit: '', testDate: '', durationMinutes: 45 }
  if (kind === 'resources') return { title: '', description: '', link: '' }
  return {}
}

const truncate = (s: string, len = 60): string => (s.length > len ? s.slice(0, len) + '…' : s)

const ASSIGNMENT_COLUMNS: Column<AssignmentDto>[] = [
  {
    key: 'title',
    label: 'Title',
    render: (a) => <span style={{ fontWeight: 650 }}>{a.title}</span>,
  },
  {
    key: 'description',
    label: 'Description',
    render: (a) => (a.description ? <span style={{ color: 'var(--muted)' }}>{truncate(a.description)}</span> : <span style={{ color: 'var(--muted)' }}>—</span>),
  },
  { key: 'givenDate', label: 'Given' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'estimatedMinutes', label: 'Est. Duration', render: (a) => `${a.estimatedMinutes} min` },
]

const TASK_COLUMNS: Column<TaskDto>[] = [
  { key: 'title', label: 'Title', render: (t) => <span style={{ fontWeight: 650 }}>{t.title}</span> },
  {
    key: 'description',
    label: 'Description',
    render: (t) => (t.description ? <span style={{ color: 'var(--muted)' }}>{truncate(t.description)}</span> : <span style={{ color: 'var(--muted)' }}>—</span>),
  },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'estimatedMinutes', label: 'Duration', render: (t) => `${t.estimatedMinutes} min` },
  {
    key: 'priority',
    label: 'Priority',
    render: (t) => (
      <Badge tone={t.priority === 'HIGH' ? 'danger' : t.priority === 'LOW' ? 'muted' : 'warning'}>{t.priority}</Badge>
    ),
  },
]

const TEST_COLUMNS: Column<TestDto>[] = [
  { key: 'name', label: 'Test Name', render: (t) => <span style={{ fontWeight: 650 }}>{t.name}</span> },
  { key: 'unit', label: 'Syllabus / Unit', render: (t) => (t.unit ? t.unit : <span style={{ color: 'var(--muted)' }}>—</span>) },
  { key: 'testDate', label: 'Test Date' },
  { key: 'durationMinutes', label: 'Duration', render: (t) => `${t.durationMinutes} min` },
]

const RESOURCE_COLUMNS: Column<ResourceDto>[] = [
  { key: 'title', label: 'Title', render: (r) => <span style={{ fontWeight: 650 }}>{r.title}</span> },
  {
    key: 'description',
    label: 'Description',
    render: (r) => (r.description ? <span style={{ color: 'var(--muted)' }}>{truncate(r.description)}</span> : <span style={{ color: 'var(--muted)' }}>—</span>),
  },
  {
    key: 'link',
    label: 'Link',
    render: (r) =>
      r.link ? (
        <a href={r.link} target="_blank" rel="noreferrer">
          Open Document ↗
        </a>
      ) : (
        <span style={{ color: 'var(--muted)' }}>—</span>
      ),
  },
]

function ContentTable<R extends { id: number }>({
  rows,
  columns,
  emptyText,
  addLabel,
  onAdd,
  onEdit,
  onDelete,
}: {
  rows: R[]
  columns: Column<R>[]
  emptyText: string
  addLabel: string
  onAdd: () => void
  onEdit: (row: R) => void
  onDelete: (id: number) => void
}) {
  const actionCol: Column<R> = {
    key: '__actions',
    label: '',
    render: (row) => (
      <div className="actions">
        <Button variant="ghost" size="sm" icon={<IconEdit />} onClick={() => onEdit(row)}>
          Edit
        </Button>
        <Button variant="danger" size="sm" icon={<IconTrash />} onClick={() => onDelete(row.id)}>
          Delete
        </Button>
      </div>
    ),
  }
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <Button variant="primary" icon={<IconPlus />} onClick={onAdd}>
          {addLabel}
        </Button>
      </div>
      <DataTable<R> columns={[...columns, actionCol]} rows={rows} emptyText={emptyText} />
    </div>
  )
}

export default function SubjectHub() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [hub, setHub] = useState<SubjectHubDto | null>(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<TabKind>('overview')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<{ kind: TabKind; id: number } | null>(null)
  const [form, setForm] = useState<FormValues>({})
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ kind: TabKind; id: number } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    if (!assignmentId) return
    const h = await get<SubjectHubDto>(`/api/teacher/subject-hub/${assignmentId}`)
    setHub(h)
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load class details'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId])

  const openCreate = (kind: TabKind) => {
    setTab(kind)
    setEditing(null)
    setForm(defaultsFor(kind))
    setModalOpen(true)
  }

  const openEdit = (kind: TabKind, values: FormValues, id: number) => {
    setTab(kind)
    setEditing({ kind, id })
    setForm(values)
    setModalOpen(true)
  }

  const setField = (name: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const submit = async () => {
    if (!assignmentId) return
    const fields = fieldsFor(tab)
    for (const f of fields) {
      if (f.required && (form[f.name] == null || String(form[f.name]).trim() === '')) {
        toast(`${f.label} is required`, 'error')
        return
      }
      if (f.type === 'number') {
        const n = Number(form[f.name])
        if (Number.isNaN(n) || n < 1) {
          toast(`${f.label} must be at least 1`, 'error')
          return
        }
      }
    }
    const body: FormValues = { ...form }
    for (const f of fields) {
      if (f.type === 'number') body[f.name] = Number(body[f.name])
    }
    setSaving(true)
    try {
      if (editing) {
        await put(`/api/teacher/${tab}/${editing.id}`, body)
        toast('Updated successfully')
      } else {
        await post(`/api/teacher/subject-hub/${assignmentId}/${tab}`, body)
        toast('Created successfully')
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save record', 'error')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await del(`/api/teacher/${deleteTarget.kind}/${deleteTarget.id}`)
      toast('Deleted successfully')
      setDeleteTarget(null)
      await load()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not delete item', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const modalTitle = () => {
    const label = TABS.find((t) => t.kind === tab)?.label ?? ''
    return editing ? `Edit ${label.slice(0, -1)}` : `Add New ${label.slice(0, -1)}`
  }

  if (hub === null) {
    return error ? <div className="warning-banner">{error}</div> : <SkeletonRows rows={6} />
  }

  return (
    <>
      <div className="page-head">
        <div>
          <Button variant="ghost" size="sm" icon={<IconChevronLeft />} onClick={() => navigate('/teacher/my-classes')}>
            Back to My Classes
          </Button>
          <h1 className="page-title" style={{ marginTop: 8 }}>
            {hub.subjectLabel}
          </h1>
          <div className="page-subtitle">
            Section: <strong>{hub.sectionLabel}</strong> · Term: {hub.semesterLabel}
            <Badge tone={hub.designation === 'PRIMARY' ? 'primary' : 'info'} style={{ marginLeft: 8 }}>
              {hub.designation === 'PRIMARY' ? 'Primary Faculty' : 'Secondary Faculty'}
            </Badge>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="primary" icon={<IconQr />} onClick={() => navigate('/teacher')}>
            Launch Attendance Engine
          </Button>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.kind}
            type="button"
            className={`tab-btn${tab === t.kind ? ' active' : ''}`}
            onClick={() => {
              setTab(t.kind)
              setModalOpen(false)
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card card-pad">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Active Assignments ({hub.assignments.length})</h3>
                <Button variant="ghost" size="sm" icon={<IconPlus />} onClick={() => openCreate('assignments')}>
                  Add
                </Button>
              </div>
              {hub.assignments.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 8px' }}>No assignments created yet.</div>
              ) : (
                hub.assignments.slice(0, 3).map((a) => (
                  <div key={a.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 650 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      Due Date: {a.dueDate} · Est. Time: {a.estimatedMinutes} mins
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="card card-pad">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Practice Tasks ({hub.tasks.length})</h3>
                <Button variant="ghost" size="sm" icon={<IconPlus />} onClick={() => openCreate('tasks')}>
                  Add
                </Button>
              </div>
              {hub.tasks.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 8px' }}>No tasks created yet.</div>
              ) : (
                hub.tasks.slice(0, 3).map((t) => (
                  <div key={t.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 650 }}>{t.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Due: {t.dueDate}</div>
                    </div>
                    <Badge tone={t.priority === 'HIGH' ? 'danger' : 'warning'}>{t.priority}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card card-pad">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Scheduled Tests ({hub.tests.length})</h3>
                <Button variant="ghost" size="sm" icon={<IconPlus />} onClick={() => openCreate('tests')}>
                  Add
                </Button>
              </div>
              {hub.tests.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px 8px' }}>No tests scheduled.</div>
              ) : (
                hub.tests.map((t) => (
                  <div key={t.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 650 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      Date: {t.testDate} · Duration: {t.durationMinutes} min
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="card card-pad">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Shared Resources ({hub.resources.length})</h3>
                <Button variant="ghost" size="sm" icon={<IconPlus />} onClick={() => openCreate('resources')}>
                  Add
                </Button>
              </div>
              {hub.resources.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px 8px' }}>No resources shared yet.</div>
              ) : (
                hub.resources.map((r) => (
                  <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 650 }}>{r.title}</div>
                    {r.link && (
                      <a href={r.link} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                        Open Document Link ↗
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'attendance' && (
        <div className="card card-pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Classroom Attendance Management</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--muted)' }}>
                Start, generate, refresh, or finalize period-wise attendance QR codes for {hub.sectionLabel}.
              </p>
            </div>
            <Button variant="primary" size="lg" icon={<IconQr />} onClick={() => navigate('/teacher')}>
              GENERATE CLASSROOM QR
            </Button>
          </div>

          <div style={{ background: 'var(--surface-2)', padding: 18, borderRadius: 'var(--radius)', marginTop: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Attendance Rules & Execution</h4>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
              <li>Generate QR becomes active when the current master timetable permits this period for {hub.sectionLabel}.</li>
              <li>QR codes auto-refresh token codes with 3-minute validity to prevent token sharing.</li>
              <li>If you are unable to take class, click <strong>Mark Absent</strong> on your Teacher Dashboard to inform students and trigger Smart Planner recommendations.</li>
            </ul>
          </div>
        </div>
      )}

      {tab === 'assignments' && (
        <ContentTable<AssignmentDto>
          rows={hub.assignments}
          columns={ASSIGNMENT_COLUMNS}
          emptyText="No assignments added yet"
          addLabel="Add Assignment"
          onAdd={() => openCreate('assignments')}
          onEdit={(a) => openEdit('assignments', { title: a.title, description: a.description ?? '', givenDate: a.givenDate, dueDate: a.dueDate, estimatedMinutes: a.estimatedMinutes }, a.id)}
          onDelete={(id) => setDeleteTarget({ kind: 'assignments', id })}
        />
      )}

      {tab === 'tasks' && (
        <ContentTable<TaskDto>
          rows={hub.tasks}
          columns={TASK_COLUMNS}
          emptyText="No practice tasks created yet"
          addLabel="Add Task"
          onAdd={() => openCreate('tasks')}
          onEdit={(t) => openEdit('tasks', { title: t.title, description: t.description ?? '', dueDate: t.dueDate, estimatedMinutes: t.estimatedMinutes, priority: t.priority }, t.id)}
          onDelete={(id) => setDeleteTarget({ kind: 'tasks', id })}
        />
      )}

      {tab === 'tests' && (
        <ContentTable<TestDto>
          rows={hub.tests}
          columns={TEST_COLUMNS}
          emptyText="No tests scheduled yet"
          addLabel="Schedule Test"
          onAdd={() => openCreate('tests')}
          onEdit={(t) => openEdit('tests', { name: t.name, unit: t.unit ?? '', testDate: t.testDate, durationMinutes: t.durationMinutes }, t.id)}
          onDelete={(id) => setDeleteTarget({ kind: 'tests', id })}
        />
      )}

      {tab === 'resources' && (
        <ContentTable<ResourceDto>
          rows={hub.resources}
          columns={RESOURCE_COLUMNS}
          emptyText="No study resources uploaded yet"
          addLabel="Share Resource"
          onAdd={() => openCreate('resources')}
          onEdit={(r) => openEdit('resources', { title: r.title, description: r.description ?? '', link: r.link ?? '' }, r.id)}
          onDelete={(id) => setDeleteTarget({ kind: 'resources', id })}
        />
      )}

      {/* Form Modal for Items */}
      <Modal
        open={modalOpen}
        title={modalTitle()}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submit} loading={saving}>
              Save Item
            </Button>
          </>
        }
      >
        <div className="form-grid">
          {fieldsFor(tab).map((f) => (
            <FieldEditor key={f.name} field={f} value={form[f.name]} onChange={(v) => setField(f.name, v)} />
          ))}
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={deleteTarget !== null}
        title={`Delete ${deleteTarget?.kind.slice(0, -1)}?`}
        message="Are you sure you want to delete this record? Students will no longer see this item in their planner."
        confirmText="Delete Item"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}

function FieldEditor({ field, value, onChange }: { field: Field; value: unknown; onChange: (value: unknown) => void }) {
  const cls = field.fullWidth ? 'field full' : 'field'

  if (field.type === 'textarea') {
    return (
      <div className={cls}>
        <label>{field.label}</label>
        <textarea rows={3} value={String(value ?? '')} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
      </div>
    )
  }

  if (field.type === 'select') {
    return (
      <div className={cls}>
        <label>{field.label}</label>
        <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">— Select Option —</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  if (field.type === 'date') {
    return (
      <div className={cls}>
        <label>{field.label}</label>
        <input type="date" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
      </div>
    )
  }

  if (field.type === 'number') {
    return (
      <div className={cls}>
        <label>{field.label}</label>
        <input type="number" min={1} value={String(value ?? '')} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />
      </div>
    )
  }

  return (
    <div className={cls}>
      <label>{field.label}</label>
      <input type="text" value={String(value ?? '')} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
