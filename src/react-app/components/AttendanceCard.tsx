import { Clock, User, Calendar } from 'lucide-react';
import type { AttendanceRecordWithEmployee } from '@/shared/types';

interface AttendanceCardProps {
  record: AttendanceRecordWithEmployee;
  statusSuffix?: string; // e.g., "Short break 3m", "Lunch break 42m", "First of day", "Last of day"
}

export default function AttendanceCard({ record, statusSuffix }: AttendanceCardProps) {
  const isCheckIn = record.status === 'checkin';
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6 transition-all duration-200 bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-md">
      <div className="flex items-start justify-between">
        {/* Employee Info */}
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isCheckIn ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <User className={`w-6 h-6 ${isCheckIn ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{record.employee_name}</h3>
            <div className="flex items-center mt-1 space-x-4 text-sm text-gray-600">
              {record.employee_emp_id && (
                <span className="text-gray-500">ID: {record.employee_emp_id}</span>
              )}
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isCheckIn 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {isCheckIn ? 'Check In' : 'Check Out'}{statusSuffix ? ` (${statusSuffix})` : ''}
        </div>
      </div>

      {/* Timestamp Info */}
      <div className="pt-4 mt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{formatTime(record.recorded_at)}</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(record.recorded_at)}</span>
            </div>
          </div>
          
          {/* Additional timestamp details */}
          {record.day_of_week && (
            <span className="text-gray-500">{record.day_of_week}</span>
          )}
        </div>

        {/* Hex Value Info (for debugging/admin) */}
        <div className="mt-2 text-xs text-gray-400">
          <span>Hex: {record.hex_value}</span>
          <span className="mx-2">•</span>
          <span>UUID: {record.company_uuid}</span>
        </div>
      </div>
    </div>
  );
}

