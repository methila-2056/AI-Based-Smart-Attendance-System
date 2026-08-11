import { useEffect, useState } from 'react'
import { DataTable } from './DataTable'
import type { Column } from './DataTable'
import { Button, ConfirmationDialog, Modal, Spinner } from './ui'
import { useToast } from './Toasts'
import { IconEdit, IconPlus, IconTrash } from './Icons'

export interface Option {
  value: string
  label: string
}

export interface FieldConfig {
  name: string
  label: string
  type?: 'text' | 'number' | 'select' | 'checkbox' | 'multicheck'
  options?: Option[]
  loadOptions?: () => Promise<Option[]>
  placeholder?: string
  required?: boolean
  fullWidth?: boolean
  hint?: string
}

export type FormValues = Record<string, unknown>

interface CrudPageProps<T> {
  title: string
  subtitle?: string
  load: () => Promise<T[]>
  create: (data: FormValues) => Promise<unknown>
  update: (id: number, data: FormValues) => Promise<unknown>
  remove: (id: number) => Promise<unknown>
  columns: Column<T>[]
  fields: FieldConfig[]
  toForm?: (row: T) => FormValues
  searchKeys?: (keyof T)[]
  getSearchText?: (row: T) => string
  defaultValues?: FormValues
  emptyText?: string
}

export function CrudPage<T extends { id: number }>({
  title,
  subtitle,
  load,
  create,
  update,
  remove,
  columns,
  fields,
  toForm,
  searchKeys,
  getSearchText,
  defaultValues = {},
  emptyText,
}: CrudPageProps<T>) {
  const { toast } = useToast()
  const [rows, setRows] = useState<T[] | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [form, setForm] = useState<FormValues>(defaultValues)
  const [saving, setSaving] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [options, setOptions] = useState<Record<string, Option[]>>({})

  useEffect(() => {
    load()
      .then(setRows)
      .catch((err) => toast(err.message, 'error'))
  }, [load, toast])

  useEffect(() => {
    for (const f of fields) {
      if (f.loadOptions && !options[f.name]) {
        f.loadOptions()
          .then((opts) => setOptions((prev) => ({ ...prev, [f.name]: opts })))
          .catch(() => toast('Failed to load ' + f.label, 'error'))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields])

  const openCreate = () => {
    setEditing(null)
    setForm(defaultValues)
    setOpen(true)
  }

  const openEdit = (row: T) => {
    setEditing(row)
    setForm(toForm ? toForm(row) : pickFromRow(row, fields))
    setOpen(true)
  }

  const setField = (name: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const submit = async () => {
    for (const f of fields) {
      if (f.required && (form[f.name] == null || String(form[f.name]).trim() === '')) {
        toast(`${f.label} is required`, 'error')
        return
      }
    }
    setSaving(true)
    try {
      if (editing) {
        await update(editing.id, form)
        toast('Updated successfully')
      } else {
        await create(form)
        toast('Created successfully')
      }
      setOpen(false)
      setRows(await load())
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTargetId) return
    setDeleting(true)
    try {
      await remove(deleteTargetId)
      toast('Deleted successfully')
      setDeleteTargetId(null)
      setRows(await load())
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  const renderedColumns: Column<T>[] = [
    ...columns,
    {
      key: '__actions',
      label: '',
      render: (row) => (
        <div className="actions">
          <Button variant="ghost" size="sm" icon={<IconEdit />} onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" icon={<IconTrash />} onClick={() => setDeleteTargetId(row.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        <Button variant="primary" icon={<IconPlus />} onClick={openCreate}>
          Add {title}
        </Button>
      </div>

      {rows == null ? (
        <Spinner />
      ) : (
        <DataTable<T>
          columns={renderedColumns}
          rows={rows}
          searchKeys={searchKeys}
          getSearchText={getSearchText}
          emptyText={emptyText ?? `No ${title.toLowerCase()} found`}
        />
      )}

      <Modal
        open={open}
        title={editing ? `Edit ${title}` : `Add New ${title}`}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submit} loading={saving}>
              {editing ? 'Save Changes' : 'Create Record'}
            </Button>
          </>
        }
      >
        <div className="form-grid">
          {fields.map((f) => (
            <FieldEditor key={f.name} field={f} value={form[f.name]} options={options[f.name] ?? f.options} onChange={(v) => setField(f.name, v)} />
          ))}
        </div>
      </Modal>

      <ConfirmationDialog
        open={deleteTargetId !== null}
        title={`Delete ${title}`}
        message="Are you sure you want to delete this record? This action cannot be undone."
        confirmText="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  )
}

function pickFromRow<T>(row: T, fields: FieldConfig[]): FormValues {
  const record = row as Record<string, unknown>
  const out: FormValues = {}
  for (const f of fields) {
    out[f.name] = record[f.name] ?? undefined
  }
  return out
}

function FieldEditor({
  field,
  value,
  options,
  onChange,
}: {
  field: FieldConfig
  value: unknown
  options?: Option[]
  onChange: (value: unknown) => void
}) {
  const cls = field.fullWidth ? 'field full' : 'field'

  if (field.type === 'select') {
    return (
      <div className={cls}>
        <label>{field.label}</label>
        <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">— Select {field.label} —</option>
          {options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  if (field.type === 'checkbox') {
    return (
      <div className={`${cls} checkbox-row`}>
        <label>
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          {field.label}
        </label>
      </div>
    )
  }

  if (field.type === 'multicheck') {
    const selected = Array.isArray(value) ? (value as string[]) : []
    return (
      <div className={`${cls} checkbox-row`}>
        <span style={{ fontSize: 12, fontWeight: 650, color: 'var(--text)', width: '100%', marginBottom: 4 }}>{field.label}</span>
        {options?.map((o) => (
          <label key={o.value}>
            <input
              type="checkbox"
              checked={selected.includes(o.value)}
              onChange={(e) => {
                const next = e.target.checked ? [...selected, o.value] : selected.filter((v) => v !== o.value)
                onChange(next)
              }}
            />
            {o.label}
          </label>
        ))}
      </div>
    )
  }

  if (field.type === 'number') {
    return (
      <div className={cls}>
        <label>{field.label}</label>
        <input
          type="number"
          value={String(value ?? '')}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        />
      </div>
    )
  }

  return (
    <div className={cls}>
      <label>{field.label}</label>
      <input
        type="text"
        value={String(value ?? '')}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
