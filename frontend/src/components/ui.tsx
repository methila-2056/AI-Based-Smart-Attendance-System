import type { ButtonHTMLAttributes, CSSProperties, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import {
  IconAlertTriangle,
  IconFolder,
  IconSearch,
} from './Icons'

/* ---------------------------------------------------------------- Button */

export type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'default' | 'outline' | 'sm' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  loading?: boolean
}

export function Button({
  variant = 'default',
  size = 'md',
  icon,
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const sizeCls = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''
  const variantCls = variant === 'default' ? '' : `btn-${variant}`
  const cls = ['btn', variantCls, sizeCls, className].filter(Boolean).join(' ')

  return (
    <button className={cls} disabled={disabled || loading} {...props}>
      {loading ? <span className="spinner" style={{ width: 14, height: 14, margin: 0, borderWidth: 2 }} /> : icon}
      {children}
    </button>
  )
}

export function IconButton({
  icon,
  label,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: ReactNode; label: string }) {
  return (
    <button className={`icon-btn ${className}`} aria-label={label} title={label} {...props}>
      {icon}
    </button>
  )
}

/* ---------------------------------------------------------------- Badge & Status Badge */

export type BadgeTone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted'

export function Badge({
  tone = 'primary',
  dot = false,
  pulse = false,
  className = '',
  style,
  children,
}: {
  tone?: BadgeTone
  dot?: boolean
  pulse?: boolean
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <span className={`badge badge-${tone} ${className}`} style={style}>
      {dot && <span className={`badge-dot ${pulse ? 'pulse' : ''}`} />}
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: 'ACTIVE' | 'CLOSED' | 'ABSENT' | 'PRESENT' | null | undefined }) {
  if (status === 'ACTIVE' || status === 'PRESENT') {
    return (
      <Badge tone="success" dot pulse>
        {status === 'ACTIVE' ? 'Session Active' : 'Present'}
      </Badge>
    )
  }
  if (status === 'CLOSED') {
    return <Badge tone="muted">Closed</Badge>
  }
  if (status === 'ABSENT') {
    return <Badge tone="danger">Free Period</Badge>
  }
  return <Badge tone="muted">Scheduled</Badge>
}

/* ---------------------------------------------------------------- Inputs & Controls */

export function Input({ className = '', label, error, ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <div className="field">
      {label && <label htmlFor={props.id}>{label}</label>}
      <input className={`input ${className}`} {...props} />
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}

export function Select({
  className = '',
  label,
  options = [],
  error,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  options?: { value: string; label: string }[]
  error?: string
}) {
  return (
    <div className="field">
      {label && <label htmlFor={props.id}>{label}</label>}
      <select className={`select ${className}`} {...props}>
        <option value="">— Select option —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search...' }: { value: string; onChange: (val: string) => void; placeholder?: string }) {
  return (
    <div className="table-search-wrap">
      <span className="search-icon">
        <IconSearch />
      </span>
      <input type="search" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} aria-label="Search" />
    </div>
  )
}

/* ---------------------------------------------------------------- Cards & Stats */

export function StatCard({
  label,
  value,
  icon,
  desc,
  accent = 'primary',
  className = '',
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
  desc?: string
  accent?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent'
  className?: string
}) {
  return (
    <div className={`stat-card accent-${accent} ${className}`}>
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        {icon && <div className="stat-icon">{icon}</div>}
      </div>
      <div className="stat-value">{value}</div>
      {desc && <div className="stat-desc">{desc}</div>}
    </div>
  )
}

/* ---------------------------------------------------------------- Modal & Confirmation */

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  maxWidth = 560,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  maxWidth?: number
}) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmationDialog({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  tone?: 'danger' | 'primary' | 'warning'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <Modal open={open} title={title} onClose={onCancel} maxWidth={440}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `var(--${tone}-light)`,
            color: `var(--${tone})`,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <IconAlertTriangle />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{message}</p>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          {cancelText}
        </Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}

/* ---------------------------------------------------------------- Empty & Loading States */

export function EmptyState({
  icon,
  text,
  sub,
  action,
}: {
  icon?: ReactNode
  text: string
  sub?: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <div className="icon-wrap">{icon || <IconFolder />}</div>
      <div style={{ fontWeight: 650, fontSize: 15, color: 'var(--text)' }}>{text}</div>
      {sub && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, maxWidth: 360 }}>{sub}</div>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  )
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ padding: '16px 20px', borderBottom: i < rows - 1 ? '1px solid var(--border)' : 'none' }}>
          <div className="skeleton" style={{ height: 16, width: `${50 + ((i * 13) % 40)}%` }} />
        </div>
      ))}
    </div>
  )
}

export function Spinner() {
  return <div className="spinner" />
}
