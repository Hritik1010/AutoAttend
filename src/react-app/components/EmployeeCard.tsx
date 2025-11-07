import { User, Mail, Phone, Calendar, MapPin, Building, Badge, Hash, Edit, Trash2 } from 'lucide-react';
import { EmployeeDepartments, EmployeeRoles, WorkingModes, type EmployeeWithDetails, type UpdateEmployeeRequest } from '@/shared/types';
import { useState } from 'react';
import { useEmployees } from '@/react-app/hooks/useApi';

interface EmployeeCardProps {
  employee: EmployeeWithDetails;
}

export default function EmployeeCard({ employee }: EmployeeCardProps) {
  const { updateEmployee, deleteEmployeeHard } = useEmployees();
  const details = employee.details;
  const [active, setActive] = useState<boolean>(employee.is_active === 1);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<UpdateEmployeeRequest>({
    name: employee.name,
    hex_value: details?.hex_value || '',
    role: details?.role || 'Employee',
    department: details?.department || 'General',
    // default to existing working mode or Office
  // @ts-expect-error working_mode is part of UpdateEmployeeRequest shape
    working_mode: (details as unknown as { working_mode?: string })?.working_mode || 'Office',
    emp_id: details?.emp_id || '',
    email: details?.email || '',
    phone: details?.phone || '',
    hire_date: details?.hire_date || '',
    manager: details?.manager || '',
    location: details?.location || '',
    notes: details?.notes || ''
  });
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {employee.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">{employee.name}</h3>
            {details?.role && (
              <p className="text-blue-600 font-medium">{details.role}</p>
            )}
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          active 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-gray-100 text-gray-700 border border-gray-200'
        }`}>
          {active ? 'Active' : 'Inactive'}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 mb-4">
        <button
          onClick={() => setEditing(true)}
          className="px-3 py-1.5 text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg flex items-center space-x-1"
        >
          <Edit className="w-4 h-4" />
          <span>Edit</span>
        </button>
        {active ? (
          <button
            disabled={saving}
            onClick={async () => {
              if (!confirm(`Deactivate ${employee.name}?`)) return;
              setSaving(true);
              try {
                await updateEmployee(employee.id, { is_active: 0 });
                setActive(false);
              } catch {
                alert('Failed to deactivate employee');
              } finally {
                setSaving(false);
              }
            }}
            className="px-3 py-1.5 text-amber-600 hover:text-amber-800 border border-amber-200 rounded-lg flex items-center space-x-1 disabled:opacity-50"
          >
            <span>Deactivate</span>
          </button>
        ) : (
          <button
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await updateEmployee(employee.id, { is_active: 1 });
                setActive(true);
              } catch {
                alert('Failed to activate employee');
              } finally {
                setSaving(false);
              }
            }}
            className="px-3 py-1.5 text-green-600 hover:text-green-800 border border-green-200 rounded-lg flex items-center space-x-1 disabled:opacity-50"
          >
            <span>Activate</span>
          </button>
        )}
        <button
          disabled={deleting}
          onClick={async () => {
            if (!confirm(`Delete ${employee.name}? This will deactivate their profile.`)) return;
            setDeleting(true);
            try {
              if (!confirm(`This is a hard delete and will remove history. Continue deleting ${employee.name}?`)) {
                setDeleting(false);
                return;
              }
              await deleteEmployeeHard(employee.id);
            } catch {
              alert('Failed to delete employee');
            } finally {
              setDeleting(false);
            }
          }}
          className="px-3 py-1.5 text-red-600 hover:text-red-800 border border-red-200 rounded-lg flex items-center space-x-1 disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          <span>{deleting ? 'Deleting...' : 'Delete'}</span>
        </button>
      </div>

      {/* Employee Details */}
      {details && !editing && (
        <div className="space-y-3">
          {/* Department and Employee ID */}
          <div className="flex items-center space-x-6">
            {details.department && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Building className="w-4 h-4" />
                <span>{details.department}</span>
              </div>
            )}
            {details.emp_id && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Badge className="w-4 h-4" />
                <span>ID: {details.emp_id}</span>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-2">
            {details.email && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${details.email}`} className="text-blue-600 hover:underline">
                  {details.email}
                </a>
              </div>
            )}
            {details.phone && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <a href={`tel:${details.phone}`} className="text-blue-600 hover:underline">
                  {details.phone}
                </a>
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="space-y-2">
            {details.hire_date && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Hired: {formatDate(details.hire_date)}</span>
              </div>
            )}
            {details.location && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{details.location}</span>
              </div>
            )}
            {details.manager && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>Manager: {details.manager}</span>
              </div>
            )}
          </div>

          {/* Deactivated label */}
          {!active && (
            <div className="pt-1">
              <span className="inline-block text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded px-2 py-0.5">
                deactivated
              </span>
            </div>
          )}

          {/* Technical Details */}
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Hash className="w-3 h-3" />
              <span>Hex: {details.hex_value || 'Not set'}</span>
              <span className="mx-1">•</span>
              <span>UUID: {employee.uuid}</span>
            </div>
          </div>

          {/* Notes */}
          {details.notes && (
            <div className="pt-2">
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                <span className="font-medium">Notes:</span> {details.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Edit Employee</h2>
              <p className="text-gray-600 mt-1">Update details for {employee.name}</p>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSaving(true);
                try {
                  await updateEmployee(employee.id, form);
                  setEditing(false);
                } catch {
                  alert('Failed to save changes');
                } finally {
                  setSaving(false);
                }
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input value={form.name || ''} onChange={(e) => setForm(f => ({...f, name: e.target.value}))} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={form.role || ''}
                    onChange={(e) => setForm(f => ({...f, role: e.target.value}))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  >
                    {EmployeeRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={form.department || ''}
                    onChange={(e) => setForm(f => ({...f, department: e.target.value}))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  >
                    {EmployeeDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                  <input value={form.emp_id || ''} onChange={(e) => setForm(f => ({...f, emp_id: e.target.value}))} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input value={form.email || ''} onChange={(e) => setForm(f => ({...f, email: e.target.value}))} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input value={form.phone || ''} onChange={(e) => setForm(f => ({...f, phone: e.target.value}))} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hire Date</label>
                  <input type="date" value={form.hire_date || ''} onChange={(e) => setForm(f => ({...f, hire_date: e.target.value}))} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manager</label>
                  <input value={form.manager || ''} onChange={(e) => setForm(f => ({...f, manager: e.target.value}))} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input value={form.location || ''} onChange={(e) => setForm(f => ({...f, location: e.target.value}))} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Working Mode</label>
                  <select
                    value={(form as unknown as { working_mode?: string }).working_mode || 'Office'}
                    onChange={(e) => setForm(f => ({...f, ...( { working_mode: e.target.value } as unknown as UpdateEmployeeRequest)}))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  >
                    {WorkingModes.map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea value={form.notes || ''} onChange={(e) => setForm(f => ({...f, notes: e.target.value}))} rows={3} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
