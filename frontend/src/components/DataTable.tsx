import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { EmptyState, SearchInput } from './ui'
import { IconChevronLeft, IconChevronRight } from './Icons'

export interface Column<T> {
  key: string
  label: string
  render?: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  searchKeys?: (keyof T)[]
  searchPlaceholder?: string
  emptyText?: string
  toolbar?: ReactNode
  getSearchText?: (row: T) => string
  pageSize?: number
}

export function DataTable<T extends { id: number }>({
  columns,
  rows,
  searchKeys,
  searchPlaceholder = 'Search records...',
  emptyText = 'No records found',
  toolbar,
  getSearchText,
  pageSize = 10,
}: DataTableProps<T>) {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((row) => {
      if (getSearchText) {
        return getSearchText(row).toLowerCase().includes(needle)
      }
      return searchKeys?.some((k) => String((row as Record<string, unknown>)[String(k)] ?? '').toLowerCase().includes(needle))
    })
  }, [rows, q, searchKeys, getSearchText])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  return (
    <div className="card">
      <div className="table-toolbar">
        <SearchInput value={q} onChange={(val) => { setQ(val); setPage(1); }} placeholder={searchPlaceholder} />
        {toolbar}
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row) => (
              <tr key={row.id}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '')}</td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState text={emptyText} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > pageSize && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--muted)' }}>
          <div>
            Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to <strong>{Math.min(currentPage * pageSize, filtered.length)}</strong> of <strong>{filtered.length}</strong> records
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <IconChevronLeft /> Prev
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontWeight: 600, color: 'var(--text)' }}>
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next <IconChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
