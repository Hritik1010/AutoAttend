import { User, Mail, Phone, Calendar, MapPin, Building, Badge, Hash } from 'lucide-react';
import type { EmployeeWithDetails } from '@/shared/types';

interface EmployeeCardProps {
  employee: EmployeeWithDetails;
}

export default function EmployeeCard({ employee }: EmployeeCardProps) {
  const details = employee.details;
  
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
          employee.is_active 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-gray-100 text-gray-700 border border-gray-200'
        }`}>
          {employee.is_active ? 'Active' : 'Inactive'}
        </div>
      </div>

      {/* Employee Details */}
      {details && (
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
    </div>
  );
}
