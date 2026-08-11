import { del, get, post, put } from '../../api/client'
import type { Department, Staff } from '../../api/types'
import { Badge } from '../../components/ui'
import { CrudPage } from '../../components/CrudPage'
import type { FormValues } from '../../components/CrudPage'

export default function Staff() {
  return (
    <CrudPage<Staff>
      title="Staff"
      subtitle="Staff details are configured here — teachers never re-enter their own name or subject. A staff member can hold multiple role flags."
      load={() => get<Staff[]>('/api/admin/staff')}
      create={(d: FormValues) => post('/api/admin/staff', d)}
      update={(id, d) => put(`/api/admin/staff/${id}`, d)}
      remove={(id) => del(`/api/admin/staff/${id}`)}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'employeeId', label: 'Employee ID' },
        { key: 'username', label: 'Username' },
        { key: 'departmentName', label: 'Department' },
        {
          key: 'roles',
          label: 'Roles',
          render: (row) => (
            <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
              {row.roles.map((r) => (
                <Badge key={r} tone={r === 'ATTENDANCE_COORDINATOR' ? 'info' : 'primary'}>
                  {r === 'ATTENDANCE_COORDINATOR' ? 'Coordinator' : 'Subject Staff'}
                </Badge>
              ))}
              {row.roles.length === 0 && <Badge tone="muted">None</Badge>}
            </span>
          ),
        },
        {
          key: 'active',
          label: 'Status',
          render: (row) => <Badge tone={row.active ? 'success' : 'danger'}>{row.active ? 'Active' : 'Inactive'}</Badge>,
        },
      ]}
      fields={[
        { name: 'name', label: 'Name', placeholder: 'e.g. Pavithra', required: true, fullWidth: true },
        { name: 'employeeId', label: 'Employee ID', placeholder: 'e.g. CSE001', required: true },
        { name: 'username', label: 'Login username', placeholder: 'e.g. pavithra', required: true },
        {
          name: 'departmentId',
          label: 'Department',
          type: 'select',
          loadOptions: async () => {
            const depts = await get<Department[]>('/api/admin/departments')
            return depts.map((d) => ({ value: String(d.id), label: `${d.name} (${d.code})` }))
          },
        },
        { name: 'email', label: 'Email', placeholder: 'name@college.edu', fullWidth: true },
        { name: 'phone', label: 'Phone' },
        {
          name: 'roles',
          label: 'Role flags',
          type: 'multicheck',
          fullWidth: true,
          options: [
            { value: 'SUBJECT_STAFF', label: 'Subject Staff' },
            { value: 'ATTENDANCE_COORDINATOR', label: 'Attendance Coordinator' },
          ],
        },
        { name: 'password', label: 'Default password (new accounts only)', placeholder: 'Staff@123', fullWidth: true },
        { name: 'active', label: 'Active account', type: 'checkbox', fullWidth: true },
      ]}
      toForm={(row) => ({
        name: row.name,
        employeeId: row.employeeId,
        username: row.username,
        email: row.email ?? '',
        phone: row.phone ?? '',
        departmentId: row.departmentId ? String(row.departmentId) : '',
        roles: row.roles,
        password: '',
        active: row.active,
      })}
      searchKeys={['name', 'employeeId', 'username', 'email']}
    />
  )
}
