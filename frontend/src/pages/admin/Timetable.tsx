import { del, get, post, put } from '../../api/client'
import type { Day, Section, Semester, Staff, Subject, TimetableEntry } from '../../api/types'
import { Badge } from '../../components/ui'
import { CrudPage } from '../../components/CrudPage'
import type { FormValues } from '../../components/CrudPage'

const DAYS: Day[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

export default function Timetable() {
  return (
    <CrudPage<TimetableEntry>
      title="Timetable"
      subtitle="Period-wise master timetable for the current semester. Entries without a staff get flagged on the dashboard."
      load={() => get<TimetableEntry[]>('/api/admin/timetable')}
      create={(d: FormValues) => post('/api/admin/timetable', d)}
      update={(id, d) => put(`/api/admin/timetable/${id}`, d)}
      remove={(id) => del(`/api/admin/timetable/${id}`)}
      columns={[
        {
          key: 'day',
          label: 'Day',
          render: (row) => row.day[0] + row.day.slice(1).toLowerCase(),
        },
        { key: 'period', label: 'Period' },
        { key: 'sectionLabel', label: 'Section' },
        { key: 'subjectLabel', label: 'Subject' },
        { key: 'staffName', label: 'Staff', render: (row) => row.staffName ?? <Badge tone="warning">Unassigned</Badge> },
        { key: 'secondaryStaffName', label: 'Secondary' },
        {
          key: 'isTest',
          label: 'Type',
          render: (row) => (row.isTest ? <Badge tone="danger">Test</Badge> : <Badge tone="success">Class</Badge>),
        },
        { key: 'testTopic', label: 'Topic' },
      ]}
      fields={[
        {
          name: 'semesterId',
          label: 'Semester',
          type: 'select',
          required: true,
          loadOptions: async () => {
            const sems = await get<Semester[]>('/api/admin/semesters')
            return sems.map((s) => ({ value: String(s.id), label: `${s.name} · ${s.academicYearName}${s.currentSemester ? ' (current)' : ''}` }))
          },
        },
        {
          name: 'sectionId',
          label: 'Section',
          type: 'select',
          required: true,
          loadOptions: async () => {
            const sections = await get<Section[]>('/api/admin/sections')
            return sections.map((s) => ({ value: String(s.id), label: s.displayName }))
          },
        },
        {
          name: 'day',
          label: 'Day',
          type: 'select',
          required: true,
          options: DAYS.map((d) => ({ value: d, label: d[0] + d.slice(1).toLowerCase() })),
        },
        { name: 'period', label: 'Period number', type: 'number', required: true },
        {
          name: 'subjectId',
          label: 'Subject',
          type: 'select',
          required: true,
          loadOptions: async () => {
            const subjects = await get<Subject[]>('/api/admin/subjects')
            return subjects.map((s) => ({ value: String(s.id), label: `${s.code} — ${s.name}` }))
          },
        },
        {
          name: 'staffId',
          label: 'Primary staff',
          type: 'select',
          loadOptions: async () => {
            const staff = await get<Staff[]>('/api/admin/staff')
            return staff.map((s) => ({ value: String(s.id), label: `${s.name} (${s.username})` }))
          },
        },
        {
          name: 'secondaryStaffId',
          label: 'Secondary staff',
          type: 'select',
          loadOptions: async () => {
            const staff = await get<Staff[]>('/api/admin/staff')
            return staff.map((s) => ({ value: String(s.id), label: `${s.name} (${s.username})` }))
          },
        },
        { name: 'isTest', label: 'Test period', type: 'checkbox', fullWidth: true },
        { name: 'testTopic', label: 'Test topic', placeholder: 'e.g. Unit 3 — Linked Lists', fullWidth: true },
      ]}
      toForm={(row) => ({
        semesterId: String(row.semesterId),
        sectionId: String(row.sectionId),
        day: row.day,
        period: row.period,
        subjectId: String(row.subjectId),
        staffId: row.staffId ? String(row.staffId) : '',
        secondaryStaffId: row.secondaryStaffId ? String(row.secondaryStaffId) : '',
        isTest: row.isTest,
        testTopic: row.testTopic ?? '',
      })}
      searchKeys={['sectionLabel', 'subjectLabel', 'staffName']}
      getSearchText={(row) => `${row.day} ${row.period} ${row.sectionLabel} ${row.subjectLabel} ${row.staffName ?? ''} ${row.testTopic ?? ''}`}
    />
  )
}
