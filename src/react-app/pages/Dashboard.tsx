import { useAttendance, useAttendanceStats } from '@/react-app/hooks/useApi';
import AttendanceCard from '@/react-app/components/AttendanceCard';
import LoadingSpinner from '@/react-app/components/LoadingSpinner';
import { Users, Clock, TrendingUp, Activity } from 'lucide-react';

export default function Dashboard() {
  const { attendance, loading: attendanceLoading } = useAttendance(10);
  const { stats, loading: statsLoading } = useAttendanceStats();

  if (attendanceLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AutoAttend Dashboard</h1>
        <p className="text-gray-600">Real-time overview of your employee attendance tracking system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats?.total_employees || 0}</p>
              <p className="text-gray-600">Total Employees</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats?.currently_present || 0}</p>
              <p className="text-gray-600">Currently Present</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats?.today_checkins || 0}</p>
              <p className="text-gray-600">Today's Check-ins</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{attendance.length}</p>
              <p className="text-gray-600">Recent Records</p>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time System Status */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-200">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-3"></div>
          <div>
            <h3 className="font-semibold text-gray-900">System Status: Active</h3>
            <p className="text-gray-600 text-sm">
              ESP32 scanners are detecting employee devices with Company UUID and converting hex names to attendance records
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          <p className="text-gray-600 mt-1">Latest attendance records from ESP32 device detection</p>
        </div>
        <div className="p-6">
          {attendance.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No attendance records yet</p>
              <div className="text-sm text-gray-500 mt-1 space-y-1">
                <p>Records will appear here when:</p>
                <p>• Employee devices advertise Company UUID: D7E1A3F4</p>
                <p>• Service data contains hex-encoded employee names</p>
                <p>• ESP32 scanner detects and processes the data</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {attendance.map((record) => (
                <AttendanceCard key={record.id} record={record} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System Information */}
      <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">How AutoAttend Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</div>
            <div>
              <p className="font-medium text-gray-900">Device Advertising</p>
              <p>Employee devices advertise Company UUID with hex-encoded names in service data</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</div>
            <div>
              <p className="font-medium text-gray-900">ESP32 Detection</p>
              <p>ESP32 scanner finds Company UUID, extracts hex value, and sends to server</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</div>
            <div>
              <p className="font-medium text-gray-900">Attendance Recording</p>
              <p>Server converts hex to employee name and records check-in/out with detailed timestamps</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
