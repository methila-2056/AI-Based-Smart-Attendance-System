import { del, get, post, put } from '../../api/client'
import type { Department } from '../../api/types'
import { CrudPage } from '../../components/CrudPage'
import type { FormValues } from '../../components/CrudPage'

export default function Departments() {
  return (
    <CrudPage<Department>
      title="Departments"
      subtitle="Academic departments that own sections, subjects and staff."
      load={() => get<Department[]>('/api/admin/departments')}
      create={(d: FormValues) => post('/api/admin/departments', d)}
      update={(id, d) => put(`/api/admin/departments/${id}`, d)}
      remove={(id) => del(`/api/admin/departments/${id}`)}
      columns={[
        { key: 'name', label: 'Department' },
        { key: 'code', label: 'Code' },
      ]}
      fields={[
        { name: 'name', label: 'Department name', placeholder: 'e.g. Computer Science and Engineering', required: true, fullWidth: true },
        { name: 'code', label: 'Code', placeholder: 'e.g. CSE', required: true },
      ]}
      searchKeys={['name', 'code']}
    />
  )
}
