import { del, get, post, put } from '../../api/client'
import type { Section, Semester, Staff, StaffSubjectAssignment, Subject } from '../../api/types'
import { Badge } from '../../components/ui'
import { CrudPage } from '../../components/CrudPage'
import type { FormValues } from '../../components/CrudPage'

export default function StaffSubjects() {
  return (
    <CrudPage<StaffSubjectAssignment>
      title="Staff–Subject Mapping"
      subtitle="Which teacher teaches which subject in which section this semester. The timetable derives teacher schedules from this mapping."
      load={() => get<StaffSubjectAssignment[]>('/api/admin/staff-subjects')}
      create={(d: FormValues) => post('/api/admin/staff-subjects', d)}
      update={(id, d) => put(`/api/admin/staff-subjects/${id}`, d)}
      remove={(id) => del(`/api/admin/staff-subjects/${id}`)}
      columns={[
        { key: 'staffName', label: 'Staff' },
        { key: 'subjectLabel', label: 'Subject' },
        { key: 'sectionLabel', label: 'Section' },
        { key: 'semesterLabel', label: 'Semester' },
        {
          key: 'designation',
          label: 'Designation',
          render: (row) => <Badge tone={row.designation === 'PRIMARY' ? 'primary' : 'muted'}>{row.designation}</Badge>,
        },
      ]}
      fields={[
        {
          name: 'staffId',
          label: 'Staff',
          type: 'select',
          required: true,
          loadOptions: async () => {
            const staff = await get<Staff[]>('/api/admin/staff')
            return staff.map((s) => ({ value: String(s.id), label: `${s.name} (${s.username})` }))
          },
        },
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
          name: 'semesterId',
          label: 'Semester',
          type: 'select',
          required: true,
          loadOptions: async () => {
            const semesters = await get<Semester[]>('/api/admin/semesters')
            return semesters.map((s) => ({ value: String(s.id), label: `${s.name} ${s.academicYearName}${s.currentSemester ? ' (current)' : ''}` }))
          },
        },
        {
          name: 'designation',
          label: 'Designation',
          type: 'select',
          options: [
            { value: 'PRIMARY', label: 'Primary' },
            { value: 'SECONDARY', label: 'Secondary' },
          ],
        },
      ]}
      toForm={(row) => ({
        staffId: String(row.staffId),
        subjectId: String(row.subjectId),
        sectionId: String(row.sectionId),
        semesterId: String(row.semesterId),
        designation: row.designation,
      })}
      searchKeys={['staffName', 'subjectLabel', 'sectionLabel']}
    />
  )
}
