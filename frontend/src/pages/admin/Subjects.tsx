import { del, get, post, put } from '../../api/client'
import type { Department, Subject } from '../../api/types'
import { Badge } from '../../components/ui'
import { CrudPage } from '../../components/CrudPage'
import type { FormValues } from '../../components/CrudPage'

export default function Subjects() {
  return (
    <CrudPage<Subject>
      title="Subjects"
      subtitle="Subjects offered this semester, including theory and laboratory subjects."
      load={() => get<Subject[]>('/api/admin/subjects')}
      create={(d: FormValues) => post('/api/admin/subjects', d)}
      update={(id, d) => put(`/api/admin/subjects/${id}`, d)}
      remove={(id) => del(`/api/admin/subjects/${id}`)}
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Subject' },
        {
          key: 'type',
          label: 'Type',
          render: (row) => <Badge tone={row.type === 'LAB' ? 'info' : 'primary'}>{row.type}</Badge>,
        },
        { key: 'departmentName', label: 'Department' },
      ]}
      fields={[
        { name: 'code', label: 'Code', placeholder: 'e.g. DBMS', required: true },
        { name: 'name', label: 'Subject name', placeholder: 'e.g. Database Management Systems', required: true, fullWidth: true },
        {
          name: 'type',
          label: 'Type',
          type: 'select',
          required: true,
          options: [
            { value: 'THEORY', label: 'Theory' },
            { value: 'LAB', label: 'Laboratory' },
          ],
        },
        {
          name: 'departmentId',
          label: 'Department',
          type: 'select',
          loadOptions: async () => {
            const depts = await get<Department[]>('/api/admin/departments')
            return depts.map((d) => ({ value: String(d.id), label: `${d.name} (${d.code})` }))
          },
        },
      ]}
      toForm={(row) => ({ ...row, departmentId: row.departmentId ? String(row.departmentId) : '' })}
      searchKeys={['code', 'name']}
    />
  )
}
