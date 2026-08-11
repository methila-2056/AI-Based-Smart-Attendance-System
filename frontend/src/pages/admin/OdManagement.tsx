import { useEffect, useState } from 'react'
import { get, post, put } from '../../api/client'
import type {
  CreateOdRequest,
  Department,
  OdPeriodInfo,
  OdRecordDetailDto,
  OdRecordDto,
  OdStatus,
  Section,
  StudentSelectDto,
  UpdateOdRequest,
} from '../../api/types'
import {
  IconArrowRight,
  IconBuilding,
  IconCalendar,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconPlus,
  IconSearch,
  IconUsers,
} from '../../components/Icons'
import { useToast } from '../../components/Toasts'

interface PeriodGroup {
  label: string
  startTime: string
  endTime: string
  subjectLabel: string
  staffName: string
  isBlock: boolean
  count: number
}

function groupPreviewPeriods(periods: OdPeriodInfo[]): PeriodGroup[] {
  if (periods.length === 0) return []
  const groups: PeriodGroup[] = []
  let currentGroup: OdPeriodInfo[] = [periods[0]]

  for (let i = 1; i < periods.length; i++) {
    const prev = periods[i - 1]
    const curr = periods[i]
    if (
      curr.period === prev.period + 1 &&
      curr.subjectLabel === prev.subjectLabel &&
      curr.staffName === prev.staffName
    ) {
      currentGroup.push(curr)
    } else {
      groups.push(makeGroup(currentGroup))
      currentGroup = [curr]
    }
  }
  if (currentGroup.length > 0) {
    groups.push(makeGroup(currentGroup))
  }
  return groups
}

function makeGroup(items: OdPeriodInfo[]): PeriodGroup {
  if (items.length === 1) {
    return {
      label: `Period ${items[0].period}`,
      startTime: items[0].startTime,
      endTime: items[0].endTime,
      subjectLabel: items[0].subjectLabel,
      staffName: items[0].staffName,
      isBlock: false,
      count: 1,
    }
  }
  const first = items[0]
  const last = items[items.length - 1]
  const isLab = first.subjectLabel.toLowerCase().includes('lab') || items.length >= 3
  return {
    label: `Periods ${first.period}–${last.period} (${items.length}-Hr ${isLab ? 'Lab Block' : 'Block'})`,
    startTime: first.startTime,
    endTime: last.endTime,
    subjectLabel: first.subjectLabel,
    staffName: first.staffName,
    isBlock: true,
    count: items.length,
  }
}

export default function OdManagement() {
  const { toast } = useToast()
  const [records, setRecords] = useState<OdRecordDto[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)

  // Filter state
  const [activeTab, setActiveTab] = useState<string>('ALL')
  const [selectedDeptId, setSelectedDeptId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null)
  const [viewingDetail, setViewingDetail] = useState<OdRecordDetailDto | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Form State
  const [eventName, setEventName] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [fromTime, setFromTime] = useState('09:15')
  const [toTime, setToTime] = useState('16:15')
  const [departmentId, setDepartmentId] = useState<number | ''>('')
  const [yearLabel, setYearLabel] = useState('III Year')
  const [sectionId, setSectionId] = useState<number | ''>('')

  // Students & Period Preview state
  const [availableStudents, setAvailableStudents] = useState<StudentSelectDto[]>([])
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([])
  const [studentSearch, setStudentSearch] = useState('')
  const [previewPeriods, setPreviewPeriods] = useState<OdPeriodInfo[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [seedingDemo, setSeedingDemo] = useState(false)

  const handleSeedDemoOd = async () => {
    setSeedingDemo(true)
    try {
      await post('/api/admin/od-records/seed-demo')
      toast('Demo On-Duty (OD) records seeded successfully!', 'success')
      loadData()
    } catch (err: any) {
      toast(err.message || 'Failed to seed demo OD records', 'error')
    } finally {
      setSeedingDemo(false)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [recs, depts, secs] = await Promise.all([
        get<OdRecordDto[]>('/api/admin/od-records'),
        get<Department[]>('/api/admin/departments'),
        get<Section[]>('/api/admin/sections'),
      ])
      setRecords(recs)
      setDepartments(depts)
      setSections(secs)
      if (depts.length > 0 && departmentId === '') {
        setDepartmentId(depts[0].id)
      }
      if (secs.length > 0 && sectionId === '') {
        setSectionId(secs[0].id)
      }
    } catch (err: any) {
      toast(err.message || 'Failed to load OD management data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Load students for modal whenever departmentId, yearLabel, or sectionId change
  useEffect(() => {
    if (!showCreateModal) return
    const fetchStudents = async () => {
      try {
        const queryParams = new URLSearchParams()
        if (sectionId) queryParams.append('sectionId', String(sectionId))
        else {
          if (departmentId) queryParams.append('departmentId', String(departmentId))
          if (yearLabel) queryParams.append('yearLabel', yearLabel)
        }
        const data = await get<StudentSelectDto[]>(`/api/admin/od-records/students?${queryParams.toString()}`)
        setAvailableStudents(data)
      } catch (err: any) {
        toast(err.message || 'Failed to fetch student list', 'error')
      }
    }
    fetchStudents()
  }, [showCreateModal, departmentId, yearLabel, sectionId])

  // Preview periods whenever sectionId, date, fromTime, or toTime change
  useEffect(() => {
    if (!showCreateModal || !sectionId || !date || !fromTime || !toTime) {
      setPreviewPeriods([])
      return
    }
    const fetchPreview = async () => {
      setPreviewLoading(true)
      try {
        const params = new URLSearchParams({
          sectionId: String(sectionId),
          date,
          fromTime: fromTime.length === 5 ? `${fromTime}:00` : fromTime,
          toTime: toTime.length === 5 ? `${toTime}:00` : toTime,
        })
        const periods = await get<OdPeriodInfo[]>(`/api/admin/od-records/preview-periods?${params.toString()}`)
        setPreviewPeriods(periods)
      } catch {
        setPreviewPeriods([])
      } finally {
        setPreviewLoading(false)
      }
    }
    fetchPreview()
  }, [showCreateModal, sectionId, date, fromTime, toTime])

  const handleOpenCreateModal = () => {
    setEditingRecordId(null)
    setEventName('')
    setDate(new Date().toISOString().split('T')[0])
    setFromTime('09:15')
    setToTime('16:15')
    if (departments.length > 0) setDepartmentId(departments[0].id)
    setYearLabel('III Year')
    if (sections.length > 0) setSectionId(sections[0].id)
    setSelectedStudentIds([])
    setStudentSearch('')
    setShowConfirmation(false)
    setShowCreateModal(true)
  }

  const handleOpenEditModal = async (record: OdRecordDto) => {
    setEditingRecordId(record.id)
    setEventName(record.eventName)
    setDate(record.date)
    setFromTime(record.fromTime.slice(0, 5))
    setToTime(record.toTime.slice(0, 5))
    setDepartmentId(record.departmentId)
    setYearLabel(record.yearLabel)
    setSectionId(record.sectionId)
    setShowConfirmation(false)
    setShowCreateModal(true)

    try {
      const detail = await get<OdRecordDetailDto>(`/api/admin/od-records/${record.id}`)
      setSelectedStudentIds(detail.students.map((s) => s.id))
    } catch {
      toast('Failed to load OD record details for editing', 'error')
    }
  }

  const handleOpenDetailModal = async (id: number) => {
    setLoadingDetail(true)
    setViewingDetail(null)
    try {
      const detail = await get<OdRecordDetailDto>(`/api/admin/od-records/${id}`)
      setViewingDetail(detail)
    } catch (err: any) {
      toast(err.message || 'Failed to load details', 'error')
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleSelectVisibleStudents = () => {
    const filteredIds = filteredStudents.map((s) => s.id)
    setSelectedStudentIds(Array.from(new Set([...selectedStudentIds, ...filteredIds])))
  }

  const handleClearStudentSelection = () => {
    setSelectedStudentIds([])
  }

  const toggleStudentSelect = (id: number) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((sid) => sid !== id))
    } else {
      setSelectedStudentIds([...selectedStudentIds, id])
    }
  }

  const handleFormSubmitAttempt = (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventName.trim()) {
      toast('Please enter an event or reason name.', 'error')
      return
    }
    if (!departmentId || !sectionId) {
      toast('Please select a department and section.', 'error')
      return
    }
    if (selectedStudentIds.length === 0) {
      toast('Please select at least one student for OD grant.', 'error')
      return
    }
    setShowConfirmation(true)
  }

  const handleConfirmAndSubmit = async () => {
    setSubmitting(true)
    try {
      const formattedFromTime = fromTime.length === 5 ? `${fromTime}:00` : fromTime
      const formattedToTime = toTime.length === 5 ? `${toTime}:00` : toTime

      if (editingRecordId) {
        const payload: UpdateOdRequest = {
          eventName: eventName.trim(),
          date,
          fromTime: formattedFromTime,
          toTime: formattedToTime,
          departmentId: Number(departmentId),
          yearLabel: yearLabel.trim(),
          sectionId: Number(sectionId),
          studentIds: selectedStudentIds,
        }
        await put(`/api/admin/od-records/${editingRecordId}`, payload)
        toast('OD record updated and attendance recalculated successfully!', 'success')
      } else {
        const payload: CreateOdRequest = {
          eventName: eventName.trim(),
          date,
          fromTime: formattedFromTime,
          toTime: formattedToTime,
          departmentId: Number(departmentId),
          yearLabel: yearLabel.trim(),
          sectionId: Number(sectionId),
          studentIds: selectedStudentIds,
        }
        await post('/api/admin/od-records', payload)
        toast('On-Duty (OD) officially granted and timetable attendance updated!', 'success')
      }
      setShowConfirmation(false)
      setShowCreateModal(false)
      loadData()
    } catch (err: any) {
      toast(err.message || 'Failed to grant OD record', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelOd = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this OD record? Reverting will remove OD attendance for affected periods.')) {
      return
    }
    try {
      await post(`/api/admin/od-records/${id}/cancel`)
      toast('OD record cancelled and student attendance reverted.', 'success')
      if (viewingDetail && viewingDetail.id === id) {
        setViewingDetail(null)
      }
      loadData()
    } catch (err: any) {
      toast(err.message || 'Failed to cancel OD record', 'error')
    }
  }

  // Filter students in modal
  const filteredStudents = availableStudents.filter((s) => {
    const q = studentSearch.toLowerCase()
    return s.name.toLowerCase().includes(q) || s.registerNumber.toLowerCase().includes(q)
  })

  // Filter table records
  const filteredRecords = records.filter((r) => {
    if (activeTab !== 'ALL' && r.status !== activeTab) return false
    if (selectedDeptId && r.departmentId !== Number(selectedDeptId)) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const match =
        r.eventName.toLowerCase().includes(q) ||
        r.sectionLabel.toLowerCase().includes(q) ||
        r.departmentName.toLowerCase().includes(q) ||
        r.date.includes(q)
      if (!match) return false
    }
    return true
  })

  // Summary Counters
  const activeCount = records.filter((r) => r.status === 'ACTIVE').length
  const upcomingCount = records.filter((r) => r.status === 'UPCOMING').length
  const completedCount = records.filter((r) => r.status === 'COMPLETED').length
  const totalStudentsGranted = records
    .filter((r) => r.status !== 'CANCELLED')
    .reduce((acc, curr) => acc + curr.studentCount, 0)

  const renderStatusBadge = (status: OdStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="badge badge-success">Active Today</span>
      case 'UPCOMING':
        return <span className="badge badge-primary">Upcoming</span>
      case 'COMPLETED':
        return <span className="badge badge-secondary">Completed</span>
      case 'CANCELLED':
        return <span className="badge badge-danger">Cancelled</span>
      default:
        return <span className="badge badge-secondary">{status}</span>
    }
  }

  const groupedPreview = groupPreviewPeriods(previewPeriods)
  const isFormValid = eventName.trim().length > 0 && selectedStudentIds.length > 0 && !!departmentId && !!sectionId

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>OD (On-Duty) Management</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 14 }}>
            Officially grant On-Duty attendance to students. Timetable periods automatically match and register as OD – Present.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary" onClick={handleSeedDemoOd} disabled={seedingDemo}>
            <IconCalendar style={{ width: 16, height: 16 }} />
            <span>{seedingDemo ? 'Seeding...' : 'Seed Demo OD Data'}</span>
          </button>
          <button type="button" className="btn btn-primary" onClick={handleOpenCreateModal}>
            <IconPlus style={{ width: 16, height: 16 }} />
            <span>Grant On-Duty (OD)</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
        <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--primary)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <IconUsers style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{totalStudentsGranted}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Total Students Granted OD</div>
          </div>
        </div>

        <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--success)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <IconCheckCircle style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{activeCount}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Active OD Records Today</div>
          </div>
        </div>

        <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(59, 130, 246, 0.12)',
              color: '#3b82f6',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <IconCalendar style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{upcomingCount}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Upcoming Events</div>
          </div>
        </div>

        <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(107, 114, 128, 0.12)',
              color: 'var(--muted)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <IconClock style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{completedCount}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Completed Records</div>
          </div>
        </div>
      </div>

      {/* Filter Bar & Controls */}
      <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Records' },
              { id: 'ACTIVE', label: `Active (${activeCount})` },
              { id: 'UPCOMING', label: `Upcoming (${upcomingCount})` },
              { id: 'COMPLETED', label: `Completed (${completedCount})` },
              { id: 'CANCELLED', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Dept Dropdown */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 200 }}>
              <IconSearch
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 14,
                  height: 14,
                  color: 'var(--muted)',
                }}
              />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: 30, fontSize: 13, height: 34 }}
                placeholder="Search event, section..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="form-control"
              style={{ width: 170, fontSize: 13, height: 34 }}
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* OD Records Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="spinner" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <IconSearch style={{ width: 32, height: 32, opacity: 0.5 }} />
            <div style={{ fontWeight: 600 }}>No On-Duty (OD) records found</div>
            <div style={{ fontSize: 13, maxWidth: 400 }}>
              Click <strong>"Grant On-Duty (OD)"</strong> above to create a record, or click below to populate realistic dummy OD data automatically.
            </div>
            <button type="button" className="btn btn-sm btn-primary" style={{ marginTop: 6 }} onClick={handleSeedDemoOd} disabled={seedingDemo}>
              <IconCalendar style={{ width: 14, height: 14 }} />
              <span>{seedingDemo ? 'Seeding Demo Data...' : 'Seed Sample OD Data Now'}</span>
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Event / Reason</th>
                  <th>Date</th>
                  <th>Time Range</th>
                  <th>Department</th>
                  <th>Year & Section</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{r.eventName}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>ID: #{r.id}</div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{r.date}</td>
                    <td>
                      <span className="badge badge-secondary" style={{ fontSize: 12 }}>
                        {r.fromTime.slice(0, 5)} – {r.toTime.slice(0, 5)}
                      </span>
                    </td>
                    <td>{r.departmentName}</td>
                    <td>
                      <span className="badge badge-primary">{r.yearLabel}</span>{' '}
                      <span style={{ fontWeight: 600 }}>{r.sectionLabel}</span>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontWeight: 700 }}>
                        {r.studentCount} Students
                      </span>
                    </td>
                    <td>{renderStatusBadge(r.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-xs btn-ghost"
                          onClick={() => handleOpenDetailModal(r.id)}
                          title="View student list and affected timetable periods"
                        >
                          Details
                        </button>
                        {r.status !== 'CANCELLED' && (
                          <>
                            <button
                              type="button"
                              className="btn btn-xs btn-ghost"
                              onClick={() => handleOpenEditModal(r)}
                              title="Edit OD details or student list"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-xs btn-ghost"
                              style={{ color: 'var(--danger)' }}
                              onClick={() => handleCancelOd(r.id)}
                              title="Cancel OD record and revert attendance"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REDESIGNED ENTERPRISE-GRADE GRANT / EDIT OD MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div
            className="modal-content card"
            style={{
              maxWidth: 960,
              width: '92%',
              maxHeight: '90vh',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* STICKY HEADER */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--card)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text)' }}>
                  {editingRecordId ? 'Edit On-Duty (OD) Grant' : 'Grant Official On-Duty (OD)'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                  Create an official OD record and automatically apply it to the affected attendance periods.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-xs btn-ghost"
                onClick={() => setShowCreateModal(false)}
                style={{ fontSize: 18, width: 32, height: 32, borderRadius: 'var(--radius-sm)' }}
              >
                ✕
              </button>
            </div>

            {/* SCROLLABLE FORM BODY */}
            <form
              onSubmit={handleFormSubmitAttempt}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
              }}
            >
              {/* SECTION 1: OD DETAILS */}
              <div
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 700, fontSize: 14 }}>
                  <IconCalendar style={{ width: 18, height: 18 }} />
                  <span>1. Event & Schedule Details</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>
                      Event / Reason Name *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ height: 40, borderRadius: 10, fontSize: 13.5, padding: '0 14px' }}
                      placeholder="e.g. Internal Hackathon, Sports Tournament, Technical Symposium"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid-2" style={{ gap: 16, alignItems: 'end' }}>
                    <div>
                      <label className="form-label" style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>
                        Date *
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        style={{ height: 40, borderRadius: 10, fontSize: 13.5, padding: '0 14px' }}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>
                        Time Range *
                      </label>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          background: 'var(--surface-2)',
                          padding: '3px 8px',
                          borderRadius: 10,
                          border: '1px solid var(--border)',
                        }}
                      >
                        <input
                          type="time"
                          className="form-control"
                          style={{ height: 34, border: 'none', background: 'transparent', fontSize: 13.5, padding: 0 }}
                          value={fromTime}
                          onChange={(e) => setFromTime(e.target.value)}
                          required
                        />
                        <IconArrowRight style={{ width: 14, height: 14, color: 'var(--muted)', flexShrink: 0 }} />
                        <input
                          type="time"
                          className="form-control"
                          style={{ height: 34, border: 'none', background: 'transparent', fontSize: 13.5, padding: 0 }}
                          value={toTime}
                          onChange={(e) => setToTime(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: ACADEMIC SCOPE */}
              <div
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 700, fontSize: 14 }}>
                  <IconBuilding style={{ width: 18, height: 18 }} />
                  <span>2. Academic Scope</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>
                      Department *
                    </label>
                    <select
                      className="form-control"
                      style={{ height: 40, borderRadius: 10, fontSize: 13.5 }}
                      value={departmentId}
                      onChange={(e) => setDepartmentId(Number(e.target.value))}
                      required
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.code} - {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>
                      Academic Year *
                    </label>
                    <select
                      className="form-control"
                      style={{ height: 40, borderRadius: 10, fontSize: 13.5 }}
                      value={yearLabel}
                      onChange={(e) => setYearLabel(e.target.value)}
                      required
                    >
                      <option value="I Year">I Year</option>
                      <option value="II Year">II Year</option>
                      <option value="III Year">III Year</option>
                      <option value="IV Year">IV Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>
                      Class Section *
                    </label>
                    <select
                      className="form-control"
                      style={{ height: 40, borderRadius: 10, fontSize: 13.5 }}
                      value={sectionId}
                      onChange={(e) => setSectionId(Number(e.target.value))}
                      required
                    >
                      {sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.displayName} ({s.departmentName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: AUTO-MATCHED TIMETABLE PERIODS CARD */}
              <div
                style={{
                  background: 'color-mix(in srgb, var(--primary) 5%, var(--card))',
                  border: '1px solid color-mix(in srgb, var(--primary) 22%, var(--border))',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-sm)',
                        background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
                        color: 'var(--primary)',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <IconClock style={{ width: 18, height: 18 }} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                        Auto-Matched Timetable Periods
                      </h4>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)' }}>
                        These scheduled periods will automatically be marked as <strong>OD – Present</strong> for selected students.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {previewLoading && <span className="spinner" style={{ width: 16, height: 16 }} />}
                    <span className="badge badge-primary" style={{ fontWeight: 700, fontSize: 12.5, padding: '5px 12px' }}>
                      {previewPeriods.length} Periods Affected
                    </span>
                  </div>
                </div>

                {previewPeriods.length === 0 ? (
                  <div
                    style={{
                      background: 'var(--card)',
                      borderRadius: 10,
                      padding: '16px',
                      textAlign: 'center',
                      fontSize: 13,
                      color: 'var(--muted)',
                      border: '1px dashed var(--border)',
                    }}
                  >
                    No scheduled timetable periods overlap with {fromTime} – {toTime} for this section on {date}.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                    {groupedPreview.map((g, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'var(--card)',
                          border: '1px solid color-mix(in srgb, var(--primary) 20%, var(--border))',
                          borderRadius: 10,
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span
                            className={`badge ${g.isBlock ? 'badge-info' : 'badge-primary'}`}
                            style={{ fontWeight: 700, fontSize: 11.5 }}
                          >
                            {g.label}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
                            {g.startTime} – {g.endTime}
                          </span>
                        </div>

                        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)', marginTop: 2 }}>
                          {g.subjectLabel}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, color: 'var(--muted)' }}>
                          <span>Faculty: {g.staffName}</span>
                          <span style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <IconCheck style={{ width: 12, height: 12 }} /> Auto-OD
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 4: SELECT PARTICIPATING STUDENTS */}
              <div
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconUsers style={{ width: 18, height: 18, color: 'var(--primary)' }} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                      4. Select Participating Students
                    </span>
                    <span className="badge badge-info" style={{ fontWeight: 700, marginLeft: 4 }}>
                      {selectedStudentIds.length} Selected
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', width: 220 }}>
                      <IconSearch
                        style={{
                          position: 'absolute',
                          left: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 14,
                          height: 14,
                          color: 'var(--muted)',
                        }}
                      />
                      <input
                        type="text"
                        className="form-control"
                        style={{ paddingLeft: 30, fontSize: 12.5, height: 32, borderRadius: 8 }}
                        placeholder="Search by name or register..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                      />
                    </div>

                    <button
                      type="button"
                      className="btn btn-xs btn-secondary"
                      onClick={handleSelectVisibleStudents}
                      title="Select all currently filtered students"
                    >
                      Select Visible ({filteredStudents.length})
                    </button>
                    <button
                      type="button"
                      className="btn btn-xs btn-ghost"
                      onClick={handleClearStudentSelection}
                      title="Clear student selection"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    maxHeight: 240,
                    overflowY: 'auto',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    background: 'var(--card)',
                  }}
                >
                  {filteredStudents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', fontSize: 13, color: 'var(--muted)' }}>
                      No students found matching your filter criteria.
                    </div>
                  ) : (
                    <table className="table" style={{ margin: 0, fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th style={{ width: 40, textAlign: 'center' }}>✓</th>
                          <th>Student Name</th>
                          <th>Register Number</th>
                          <th>Section</th>
                          <th style={{ textAlign: 'right' }}>Selection Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((st) => {
                          const isSelected = selectedStudentIds.includes(st.id)
                          return (
                            <tr
                              key={st.id}
                              onClick={() => toggleStudentSelect(st.id)}
                              style={{
                                cursor: 'pointer',
                                background: isSelected ? 'color-mix(in srgb, var(--primary) 8%, var(--card))' : undefined,
                                transition: 'background 0.15s ease',
                              }}
                            >
                              <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleStudentSelect(st.id)}
                                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                                />
                              </td>
                              <td style={{ fontWeight: 650, color: 'var(--text)' }}>{st.name}</td>
                              <td style={{ fontFamily: 'monospace', color: 'var(--muted)', fontSize: 12 }}>
                                {st.registerNumber}
                              </td>
                              <td>
                                <span className="badge badge-secondary">{st.sectionLabel}</span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                {isSelected ? (
                                  <span className="badge badge-success">Selected</span>
                                ) : (
                                  <span className="badge badge-ghost" style={{ color: 'var(--muted)' }}>
                                    Unselected
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </form>

            {/* STICKY FOOTER */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border)',
                background: 'var(--card)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>⚡ Summary:</span>
                <span>
                  <strong>{selectedStudentIds.length}</strong> {selectedStudentIds.length === 1 ? 'student' : 'students'} selected ·{' '}
                  <strong>{previewPeriods.length}</strong> {previewPeriods.length === 1 ? 'period' : 'periods'} auto-matched
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleFormSubmitAttempt}
                  disabled={!isFormValid || submitting}
                  style={{ height: 38, padding: '0 20px', borderRadius: 8, fontWeight: 700 }}
                >
                  {editingRecordId ? 'Update OD Record' : 'Grant OD'}
                </button>
              </div>
            </div>

            {/* INLINE SUBMISSION CONFIRMATION DIALOG OVERLAY */}
            {showConfirmation && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(4px)',
                  display: 'grid',
                  placeItems: 'center',
                  zIndex: 20,
                  padding: 20,
                }}
              >
                <div
                  className="card"
                  style={{
                    maxWidth: 480,
                    width: '100%',
                    padding: 24,
                    borderRadius: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    boxShadow: 'var(--shadow-xl)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--primary)' }}>
                    <IconCheckCircle style={{ width: 24, height: 24 }} />
                    <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Confirm On-Duty (OD) Grant</h4>
                  </div>

                  <p style={{ margin: 0, fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>
                    You are about to officially grant On-Duty (OD) to <strong>{selectedStudentIds.length} students</strong> for{' '}
                    <strong>"{eventName}"</strong> on <strong>{date}</strong> ({fromTime} – {toTime}).
                  </p>

                  <div
                    style={{
                      background: 'var(--surface-2)',
                      padding: 12,
                      borderRadius: 8,
                      fontSize: 12.5,
                      color: 'var(--text)',
                    }}
                  >
                    💡 <strong>Auto-Attendance Action:</strong> {previewPeriods.length} timetable period(s) will automatically receive{' '}
                    <strong style={{ color: 'var(--primary)' }}>OD – Present</strong> status for these students.
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setShowConfirmation(false)}
                      disabled={submitting}
                    >
                      Back to Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleConfirmAndSubmit}
                      disabled={submitting}
                    >
                      {submitting ? 'Granting OD...' : 'Confirm & Grant OD'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OD RECORD DETAIL MODAL */}
      {(viewingDetail || loadingDetail) && (
        <div className="modal-backdrop" onClick={() => setViewingDetail(null)}>
          <div
            className="modal-content card"
            style={{ maxWidth: 750, width: '90%', padding: 24, maxHeight: '90vh', overflowY: 'auto', borderRadius: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            {loadingDetail || !viewingDetail ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div className="spinner" />
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{viewingDetail.eventName}</h3>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                      {viewingDetail.date} · {viewingDetail.fromTime.slice(0, 5)} – {viewingDetail.toTime.slice(0, 5)} ·{' '}
                      {viewingDetail.sectionLabel}
                    </div>
                  </div>
                  <button type="button" className="btn btn-xs btn-ghost" onClick={() => setViewingDetail(null)}>
                    ✕
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      background: 'var(--surface-2)',
                      padding: 12,
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div>
                      <strong>Status:</strong> {renderStatusBadge(viewingDetail.status)}
                    </div>
                    <div>
                      <strong>Department:</strong> {viewingDetail.departmentName}
                    </div>
                    <div>
                      <strong>Year:</strong> {viewingDetail.yearLabel}
                    </div>
                  </div>

                  {/* Affected Periods */}
                  <div>
                    <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700 }}>Affected Timetable Periods</h4>
                    {viewingDetail.affectedPeriods.length === 0 ? (
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>No timetable periods overlapped on this date.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {viewingDetail.affectedPeriods.map((p) => (
                          <div
                            key={p.period}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 12px',
                              background: 'var(--surface-1)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: 13,
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Period {p.period}</span> ({p.startTime} –{' '}
                              {p.endTime})
                            </div>
                            <div style={{ fontWeight: 600 }}>{p.subjectLabel}</div>
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Faculty: {p.staffName}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Students List */}
                  <div>
                    <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700 }}>
                      Granted Students ({viewingDetail.students.length})
                    </h4>
                    <div style={{ overflowX: 'auto', maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                      <table className="table" style={{ margin: 0 }}>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Student Name</th>
                            <th>Register Number</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewingDetail.students.map((st, i) => (
                            <tr key={st.id}>
                              <td>{i + 1}</td>
                              <td style={{ fontWeight: 600 }}>{st.name}</td>
                              <td>{st.registerNumber}</td>
                              <td>
                                <span className="badge badge-success">OD – Present</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setViewingDetail(null)}>
                      Close
                    </button>
                    {viewingDetail.status !== 'CANCELLED' && (
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleCancelOd(viewingDetail.id)}
                      >
                        Cancel OD Grant
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
