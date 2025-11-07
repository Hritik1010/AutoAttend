import { useState } from 'react';
import { useAttendance, exportAttendanceCSV } from '@/react-app/hooks/useApi';
import { Calendar, Clock, Filter, Download, Search } from 'lucide-react';
import AttendanceCard from '@/react-app/components/AttendanceCard';
import LoadingSpinner from '@/react-app/components/LoadingSpinner';

export default function Attendance() {
  const { attendance, loading, error } = useAttendance();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
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
    const recDate = record.date || new Date(record.recorded_at).toISOString().split('T')[0];
    const matchesDate = !filterDate || recDate === filterDate;
    const matchesMonth = !filterMonth || recDate.startsWith(`${filterMonth}-`);
    const matchesDepartment = !filterDepartment || record.employee_department === filterDepartment;
    
    return matchesSearch && matchesStatus && matchesDate && matchesMonth && matchesDepartment;
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
    a.download = `attendance-filtered-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportMonthFromServer = async () => {
    if (!filterMonth) return alert('Select a month first');
    try {
      const blob = await exportAttendanceCSV({ month: filterMonth, department: filterDepartment || undefined, role: undefined, });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${filterMonth}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export month CSV');
    }
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
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-4 text-red-600">Error loading attendance: {error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between mb-8 sm:flex-row sm:items-center">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Attendance Records</h1>
          <p className="text-gray-600">Real-time attendance tracking from ESP32 device detection</p>
        </div>
        <div className="flex mt-4 space-x-3 sm:mt-0">
          <button
            onClick={exportToCSV}
            className="flex items-center px-6 py-3 space-x-2 font-medium text-white transition-colors bg-green-600 shadow-lg hover:bg-green-700 rounded-xl hover:shadow-xl"
          >
            <Download className="w-5 h-5" />
            <span>Export Filtered CSV</span>
          </button>
          <button
            onClick={exportMonthFromServer}
            className="flex items-center px-6 py-3 space-x-2 font-medium text-white transition-colors bg-blue-600 shadow-lg hover:bg-blue-700 rounded-xl hover:shadow-xl"
          >
            <Download className="w-5 h-5" />
            <span>Export Month CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 mb-8 bg-white border border-gray-200 rounded-xl">
  <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Clock className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="checkin">Check In</option>
              <option value="checkout">Check Out</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Calendar className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Month Filter (for export) */}
          <div className="relative">
            <Calendar className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <Filter className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(searchTerm || filterStatus || filterDate || filterDepartment || filterMonth) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('');
                setFilterDate('');
                setFilterMonth('');
                setFilterDepartment('');
              }}
              className="px-4 py-2 text-gray-600 transition-colors border border-gray-300 rounded-lg hover:text-gray-900 hover:bg-gray-50"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="pt-4 mt-4 border-t border-gray-100">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
        <div className="py-12 text-center">
          <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            {attendance.length === 0 ? 'No attendance records yet' : 'No records match your filters'}
          </h3>
          <p className="mb-6 text-gray-600">
            {attendance.length === 0 
              ? 'Records will appear here when employees check in/out via ESP32 detection'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {attendance.length === 0 && (
            <div className="max-w-2xl p-6 mx-auto border border-blue-200 bg-blue-50 rounded-xl">
              <h4 className="mb-2 font-semibold text-blue-900">How it works:</h4>
              <div className="space-y-1 text-sm text-blue-800">
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
                <div className="sticky top-0 z-10 px-4 py-3 mb-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h3 className="flex items-center space-x-2 font-semibold text-gray-900">
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
