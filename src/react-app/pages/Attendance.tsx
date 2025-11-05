import { useState } from 'react';
import { useAttendance } from '@/react-app/hooks/useApi';
import { Calendar, Clock, Filter, Download, Search } from 'lucide-react';
import AttendanceCard from '@/react-app/components/AttendanceCard';
import LoadingSpinner from '@/react-app/components/LoadingSpinner';

export default function Attendance() {
  const { attendance, loading, error } = useAttendance();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  // Get unique departments for filter
  const departments = Array.from(new Set(
    attendance
      .map(record => record.employee_department)
      .filter(dept => dept)
  ));

  // Filter attendance records
  const filteredAttendance = attendance.filter(record => {
    const matchesSearch = record.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.employee_emp_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filterStatus || record.status === filterStatus;
    const matchesDate = !filterDate || record.date === filterDate;
    const matchesDepartment = !filterDepartment || record.employee_department === filterDepartment;
    
    return matchesSearch && matchesStatus && matchesDate && matchesDepartment;
  });

  // Group records by date
  const groupedByDate = filteredAttendance.reduce((groups, record) => {
    const date = record.date || new Date(record.recorded_at).toISOString().split('T')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(record);
    return groups;
  }, {} as Record<string, typeof attendance>);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Employee', 'Role', 'Department', 'Status', 'Hex Value'];
    const csvData = filteredAttendance.map(record => [
      record.date || new Date(record.recorded_at).toISOString().split('T')[0],
      record.time || new Date(record.recorded_at).toTimeString().split(' ')[0],
      record.employee_name,
      record.employee_role || '',
      record.employee_department || '',
      record.status,
      record.hex_value
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-records-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text="Loading attendance records..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error loading attendance: {error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Records</h1>
          <p className="text-gray-600">Real-time attendance tracking from ESP32 device detection</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 transition-colors shadow-lg hover:shadow-xl"
          >
            <Download className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Clock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="">All Status</option>
              <option value="checkin">Check In</option>
              <option value="checkout">Check Out</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Calendar className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(searchTerm || filterStatus || filterDate || filterDepartment) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('');
                setFilterDate('');
                setFilterDepartment('');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredAttendance.filter(r => r.status === 'checkin').length}
              </div>
              <div className="text-sm text-gray-600">Check-ins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {filteredAttendance.filter(r => r.status === 'checkout').length}
              </div>
              <div className="text-sm text-gray-600">Check-outs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {filteredAttendance.length}
              </div>
              <div className="text-sm text-gray-600">Total Records</div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Records */}
      {filteredAttendance.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {attendance.length === 0 ? 'No attendance records yet' : 'No records match your filters'}
          </h3>
          <p className="text-gray-600 mb-6">
            {attendance.length === 0 
              ? 'Records will appear here when employees check in/out via ESP32 detection'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {attendance.length === 0 && (
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 max-w-2xl mx-auto">
              <h4 className="font-semibold text-blue-900 mb-2">How it works:</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• Employee devices advertise Company UUID: D7E1A3F4</p>
                <p>• Service data contains hex-encoded employee names</p>
                <p>• ESP32 scanner detects and sends to AutoAttend</p>
                <p>• Attendance records are automatically created</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByDate)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([date, records]) => (
              <div key={date}>
                <div className="sticky top-0 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4 z-10">
                  <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <span>{formatDate(date)}</span>
                    <span className="text-sm font-normal text-gray-500">
                      ({records.length} record{records.length !== 1 ? 's' : ''})
                    </span>
                  </h3>
                </div>
                <div className="space-y-4">
                  {records
                    .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
                    .map((record) => (
                      <AttendanceCard key={record.id} record={record} />
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
