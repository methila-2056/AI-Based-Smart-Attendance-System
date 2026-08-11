import { del, get, post, put } from '../../api/client'
import type { Department, Section } from '../../api/types'
import { CrudPage } from '../../components/CrudPage'
import type { FormValues } from '../../components/CrudPage'

export default function Sections() {
  return (
    <CrudPage<Section>
      title="Sections"
      subtitle="Class groups such as III CSE A. Sections are the anchor for timetables and attendance."
      load={() => get<Section[]>('/api/admin/sections')}
      create={(d: FormValues) => post('/api/admin/sections', d)}
      update={(id, d) => put(`/api/admin/sections/${id}`, d)}
      remove={(id) => del(`/api/admin/sections/${id}`)}
      columns={[
        { key: 'displayName', label: 'Section' },
        { key: 'yearLabel', label: 'Year' },
        { key: 'name', label: 'Division' },
        { key: 'departmentName', label: 'Department' },
      ]}
      fields={[
        { name: 'yearLabel', label: 'Year', placeholder: 'e.g. III', required: true },
        { name: 'name', label: 'Division', placeholder: 'e.g. A', required: true },
        {
          name: 'departmentId',
          label: 'Department',
          type: 'select',
          required: true,
          loadOptions: async () => {
            const depts = await get<Department[]>('/api/admin/departments')
            return depts.map((d) => ({ value: String(d.id), label: `${d.name} (${d.code})` }))
          },
        },
      ]}
      toForm={(row) => ({ ...row, departmentId: String(row.departmentId) })}
      searchKeys={['displayName']}
      getSearchText={(row) => `${row.displayName} ${row.departmentName}`}
    />
  )
}
