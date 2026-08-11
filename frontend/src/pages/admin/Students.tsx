import { del, get, post, put } from '../../api/client'
import type { Section, Student } from '../../api/types'
import { Badge } from '../../components/ui'
import { CrudPage } from '../../components/CrudPage'
import type { FormValues } from '../../components/CrudPage'

export default function Students() {
  return (
    <CrudPage<Student>
      title="Students"
      subtitle="Every student is a login account and gets a QR identity card for period-wise attendance."
      load={() => get<Student[]>('/api/admin/students')}
      create={(d: FormValues) => post('/api/admin/students', d)}
      update={(id, d) => put(`/api/admin/students/${id}`, d)}
      remove={(id) => del(`/api/admin/students/${id}`)}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'registerNumber', label: 'Register number' },
        { key: 'sectionLabel', label: 'Section' },
        { key: 'username', label: 'Username' },
        {
          key: 'active',
          label: 'Status',
          render: (row) => <Badge tone={row.active ? 'success' : 'danger'}>{row.active ? 'Active' : 'Inactive'}</Badge>,
        },
      ]}
      fields={[
        { name: 'name', label: 'Name', placeholder: 'e.g. Mohan Kumar', required: true, fullWidth: true },
        { name: 'registerNumber', label: 'Register number', placeholder: 'e.g. 22CSE041', required: true },
        { name: 'username', label: 'Login username', placeholder: 'e.g. mohan23', required: true },
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
        { name: 'email', label: 'Email', placeholder: 'student@college.edu', fullWidth: true },
        { name: 'phone', label: 'Phone' },
        { name: 'password', label: 'Default password (new accounts only)', placeholder: 'Student@123', fullWidth: true },
        { name: 'active', label: 'Active account', type: 'checkbox', fullWidth: true },
      ]}
      toForm={(row) => ({
        name: row.name,
        registerNumber: row.registerNumber,
        email: row.email ?? '',
        phone: row.phone ?? '',
        sectionId: String(row.sectionId),
        username: row.username,
        password: '',
        active: row.active,
      })}
      searchKeys={['name', 'registerNumber', 'username', 'email']}
    />
  )
}
