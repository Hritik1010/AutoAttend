import { useState } from 'react';
import { useAttendance, exportAttendanceCSV, getAttendance } from '@/react-app/hooks/useApi';
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
  const [showMode, setShowMode] = useState<'none' | 'filtered' | 'month' | 'summary'>('none');
  const [serverMonthLogs, setServerMonthLogs] = useState<typeof attendance>([]);
  const [loadingServerMonth, setLoadingServerMonth] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [summaryDetail, setSummaryDetail] = useState<{ employee_id: number; employee_name: string; date: string } | null>(null);

  // Break / annotation helpers
  const formatDuration = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    if (m === 0) return `${rem}s`;
    if (rem === 0) return `${m}m`;
    return `${m}m ${rem}s`;
  };

  type Annotation = { statusSuffix?: string };
  const annotateRecords = (recs: typeof attendance): Record<number, Annotation> => {
    const buckets = new Map<string, typeof attendance>();
    recs.forEach(r => {
      const d = r.date || new Date(r.recorded_at).toISOString().split('T')[0];
      const key = `${r.employee_id}|${d}`;
      const arr = buckets.get(key) || [];
      arr.push(r);
      buckets.set(key, arr);
    });
    const out: Record<number, Annotation> = {};
    for (const [, arr] of buckets) {
      const sorted = arr.slice().sort((a,b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
      let lastCheckoutTs: number | null = null;
      let firstCheckinId: number | null = null;
      let lastCheckoutId: number | null = null;
      for (const r of sorted) {
        const ts = new Date(r.recorded_at).getTime();
        if (r.status === 'checkin') {
          if (firstCheckinId == null) firstCheckinId = r.id;
          if (lastCheckoutTs != null) {
            const diff = (ts - lastCheckoutTs) / 1000;
            if (diff < 5 * 60) {
              out[r.id] = { statusSuffix: `Short break ${formatDuration(diff)}` };
            } else if (diff >= 10 * 60) {
              out[r.id] = { statusSuffix: `Lunch break ${formatDuration(diff)}` };
            } else {
              out[r.id] = { statusSuffix: `Break ${formatDuration(diff)}` };
            }
          }
        } else if (r.status === 'checkout') {
          lastCheckoutTs = ts;
          lastCheckoutId = r.id;
        }
      }
      if (firstCheckinId != null) {
        out[firstCheckinId] = { statusSuffix: [out[firstCheckinId]?.statusSuffix, 'First of day'].filter(Boolean).join(' · ') };
      }
      if (lastCheckoutId != null) {
        out[lastCheckoutId] = { statusSuffix: [out[lastCheckoutId]?.statusSuffix, 'Last of day'].filter(Boolean).join(' · ') };
      }
    }
    return out;
  };

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

  const exportToCSVClient = () => {
    const headers = ['Date', 'Time', 'Employee', 'Status', 'Break Details', 'Hex Value'];
    const csvData = filteredAttendance.map(record => {
      const suffix = annotations[record.id]?.statusSuffix || '';
      return [
        record.date || new Date(record.recorded_at).toISOString().split('T')[0],
        record.time || new Date(record.recorded_at).toTimeString().split(' ')[0],
        record.employee_name,
        record.status,
        suffix,
        record.hex_value
      ];
    });
    
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

  const annotations = annotateRecords(filteredAttendance);

  const exportCSVUnified = async () => {
    // If server can handle filters for CSV (month/date/status/department), prefer server for consistent break columns
    // Choose server export when a month or date filter is set; else use client filtered export
    if (filterMonth || filterDate) {
      try {
        const blob = await exportAttendanceCSV({
          month: filterMonth || undefined,
          date: filterDate || undefined,
          department: filterDepartment || undefined,
          role: undefined,
          status: filterStatus || undefined,
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const base = filterDate || filterMonth || 'filtered';
        a.download = `attendance-${base}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to export CSV');
      }
    } else {
      // No date/month selected → client-side filtered CSV
      exportToCSVClient();
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
            onClick={exportCSVUnified}
            className="flex items-center px-6 py-3 space-x-2 font-medium text-white transition-colors bg-blue-600 shadow-lg hover:bg-blue-700 rounded-xl hover:shadow-xl"
          >
            <Download className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowMode(m => m === 'filtered' ? 'none' : 'filtered')}
            className={`flex items-center px-6 py-3 space-x-2 font-medium rounded-xl transition-colors shadow-lg hover:shadow-xl ${showMode === 'filtered' ? 'bg-purple-700 hover:bg-purple-800 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
          >
            <Clock className="w-5 h-5" />
            <span>{showMode === 'filtered' ? 'Hide Filtered Logs' : 'Show Filtered Logs'}</span>
          </button>
          <button
            onClick={async () => {
              if (!filterMonth) return alert('Select a month first');
              if (showMode === 'month') { setShowMode('none'); return; }
              try {
                setLoadingServerMonth(true);
                setServerError(null);
                const data = await getAttendance({ month: filterMonth, department: filterDepartment || undefined, status: filterStatus || undefined });
                setServerMonthLogs(data);
                setShowMode('month');
              } catch (err) {
                setServerError(err instanceof Error ? err.message : 'Failed to load month logs');
              } finally {
                setLoadingServerMonth(false);
              }
            }}
            className={`flex items-center px-6 py-3 space-x-2 font-medium rounded-xl transition-colors shadow-lg hover:shadow-xl ${showMode === 'month' ? 'bg-indigo-700 hover:bg-indigo-800 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
          >
            <Clock className="w-5 h-5" />
            <span>{showMode === 'month' ? 'Hide Month Logs' : 'Show Month Logs'}</span>
          </button>
          <button
            onClick={() => setShowMode(m => m === 'summary' ? 'none' : 'summary')}
            className={`flex items-center px-6 py-3 space-x-2 font-medium rounded-xl transition-colors shadow-lg hover:shadow-xl ${showMode === 'summary' ? 'bg-teal-700 hover:bg-teal-800 text-white' : 'bg-teal-600 hover:bg-teal-700 text-white'}`}
          >
            <Clock className="w-5 h-5" />
            <span>{showMode === 'summary' ? 'Hide Daily Summary' : 'Show Daily Summary'}</span>
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
      {/* Daily Summary Table */}
      {showMode === 'summary' && (
        <DailySummaryTable 
          records={filteredAttendance} 
          onSelect={(info) => setSummaryDetail(info)}
        />
      )}

      {/* Summary details panel (per employee per date) */}
      {showMode === 'summary' && summaryDetail && (
        <div className="mb-8 overflow-auto bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">
              Daily Details: {summaryDetail.employee_name} · {summaryDetail.date}
            </h2>
            <button
              onClick={() => setSummaryDetail(null)}
              className="px-3 py-1 text-sm text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
          {(() => {
            const dayRecords = attendance
              .filter(r => r.employee_id === summaryDetail.employee_id)
              .filter(r => (r.date || new Date(r.recorded_at).toISOString().split('T')[0]) === summaryDetail.date)
              .sort((a,b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
            const anns = annotateRecords(dayRecords);
            return (
              <table className="min-w-full text-sm">
                <thead className="text-xs text-gray-600 uppercase bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Time</th>
                    <th className="px-3 py-2 text-left">Employee</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Hex</th>
                    <th className="px-3 py-2 text-left">Emp ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dayRecords.map(r => {
                    const d = r.date || new Date(r.recorded_at).toISOString().split('T')[0];
                    const t = r.time || new Date(r.recorded_at).toTimeString().split(' ')[0];
                    const ann = anns[r.id]?.statusSuffix;
                    return (
                      <tr key={`detail-row-${r.id}`} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono text-xs text-gray-700">{d}</td>
                        <td className="px-3 py-2 font-mono text-xs text-gray-700">{t}</td>
                        <td className="px-3 py-2 text-gray-900">{r.employee_name}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${r.status === 'checkin' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.status}{ann ? ` (${ann})` : ''}</span>
                        </td>
                        <td className="px-3 py-2 font-mono text-[10px] text-gray-500 max-w-[140px] truncate" title={r.hex_value}>{r.hex_value}</td>
                        <td className="px-3 py-2 text-gray-700">{r.employee_emp_id || ''}</td>
                      </tr>
                    );
                  })}
                  {dayRecords.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-gray-500">No logs for this day.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            );
          })()}
        </div>
      )}
      {/* Structured Logs Table (Filtered or Month) */}
      {showMode !== 'none' && (
        <div className="mb-8 overflow-auto bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">
              {showMode === 'filtered' ? 'Filtered Logs' : `Month Logs (${filterMonth || 'Select month'})`}
            </h2>
            {showMode === 'month' && loadingServerMonth && <span className="text-sm text-gray-500">Loading...</span>}
            {serverError && <span className="text-sm text-red-600">{serverError}</span>}
          </div>
          <table className="min-w-full text-sm">
            <thead className="text-xs text-gray-600 uppercase bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Time</th>
                <th className="px-3 py-2 text-left">Employee</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Hex</th>
                <th className="px-3 py-2 text-left">Emp ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(showMode === 'filtered' ? filteredAttendance : serverMonthLogs)
                .sort((a,b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
                .map(r => {
                  const d = r.date || new Date(r.recorded_at).toISOString().split('T')[0];
                  const t = r.time || new Date(r.recorded_at).toTimeString().split(' ')[0];
                  const ann = (showMode === 'filtered' ? annotations : annotateRecords(serverMonthLogs))[r.id]?.statusSuffix;
                  return (
                    <tr key={`log-row-${showMode}-${r.id}`} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-xs text-gray-700">{d}</td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-700">{t}</td>
                      <td className="px-3 py-2 text-gray-900">{r.employee_name}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${r.status === 'checkin' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.status}{ann ? ` (${ann})` : ''}</span>
                      </td>
                      <td className="px-3 py-2 font-mono text-[10px] text-gray-500 max-w-[140px] truncate" title={r.hex_value}>{r.hex_value}</td>
                      <td className="px-3 py-2 text-gray-700">{r.employee_emp_id || ''}</td>
                    </tr>
                  );
                })}
              {(showMode === 'month' && !loadingServerMonth && serverMonthLogs.length === 0) && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-gray-500">No logs for selected month.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
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
                      <AttendanceCard key={record.id} record={record} statusSuffix={annotations[record.id]?.statusSuffix} />
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// Helper component to render daily summaries
function DailySummaryTable({ records, onSelect }: { records: ReturnType<typeof useAttendance>['attendance']; onSelect: (info: { employee_id: number; employee_name: string; date: string }) => void }) {
  // Group by employee and date
  type SummaryRow = {
    employee_id: number;
    employee_name: string;
    date: string;
    first_checkin?: string; // time
    last_checkout?: string; // time
    break_count: number; // retained internally (not displayed now)
    break_seconds: number; // total break seconds for the day
    worked_seconds: number;
  };

  const groups = new Map<string, { employee_id: number; employee_name: string; date: string; items: typeof records }>();
  for (const r of records) {
    const d = r.date || new Date(r.recorded_at).toISOString().split('T')[0];
    const key = `${r.employee_id}|${d}`;
    const g = groups.get(key) || { employee_id: r.employee_id, employee_name: r.employee_name, date: d, items: [] as typeof records };
    g.items.push(r);
    groups.set(key, g);
  }

  const toTime = (iso: string) => new Date(iso).toTimeString().split(' ')[0];

  const summaries: SummaryRow[] = [];
  for (const [, g] of groups) {
    const arr = g.items.slice().sort((a,b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
    let firstCheckinTs: number | null = null;
    let lastCheckoutTs: number | null = null;
    let breakCount = 0;
    let totalBreakSec = 0;
    let lastSeenCheckoutTs: number | null = null;
    let lastEventStatus: 'checkin' | 'checkout' | null = null;
    for (const r of arr) {
      const ts = new Date(r.recorded_at).getTime();
      if (r.status === 'checkin') {
        if (firstCheckinTs == null) firstCheckinTs = ts;
        if (lastSeenCheckoutTs != null) {
          const diff = Math.max(0, (ts - lastSeenCheckoutTs) / 1000);
          breakCount += 1;
          totalBreakSec += diff;
          lastSeenCheckoutTs = null;
        }
      } else if (r.status === 'checkout') {
        lastCheckoutTs = ts;
        lastSeenCheckoutTs = ts;
      }
      lastEventStatus = r.status;
    }
    // Compute worked time; for current day and if last event is a checkin, show running time until now.
    let worked = 0;
    if (firstCheckinTs != null) {
      const todayIso = new Date().toISOString().split('T')[0];
      const nowTs = Date.now();
      let effectiveEndTs: number | null = null;
      if (g.date === todayIso && lastEventStatus === 'checkin') {
        effectiveEndTs = nowTs; // running shift
      } else if (lastCheckoutTs != null) {
        effectiveEndTs = lastCheckoutTs;
      }
      if (effectiveEndTs != null) {
        const ongoingBreakSec = (g.date === todayIso && lastSeenCheckoutTs != null)
          ? Math.max(0, (nowTs - lastSeenCheckoutTs) / 1000)
          : 0;
        worked = Math.max(0, (effectiveEndTs - firstCheckinTs) / 1000 - (totalBreakSec + ongoingBreakSec));
      }
    }
    summaries.push({
      employee_id: g.employee_id,
      employee_name: g.employee_name,
      date: g.date,
      first_checkin: firstCheckinTs != null ? toTime(new Date(firstCheckinTs).toISOString()) : undefined,
      // Last checkout is only finalized/displayed after end-of-day (23:59) local time.
      last_checkout: (() => {
        if (lastCheckoutTs == null) return undefined;
        const todayIso = new Date().toISOString().split('T')[0];
        if (g.date !== todayIso) {
          return toTime(new Date(lastCheckoutTs).toISOString());
        }
        // Current date: show only if we've passed 23:59 of that date (i.e., the day ended)
        const endOfDay = new Date(`${g.date}T23:59:00`);
        if (new Date() >= endOfDay) {
          return toTime(new Date(lastCheckoutTs).toISOString());
        }
        return undefined; // Pending until day end
      })(),
      break_count: breakCount,
      break_seconds: totalBreakSec,
      worked_seconds: worked,
    });
  }

  const formatHM = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const parts = [] as string[];
    if (h > 0) parts.push(`${h}h`);
    parts.push(`${m}m`);
    return parts.join(' ');
  };

  const rows = summaries
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || a.employee_name.localeCompare(b.employee_name));

  return (
    <div className="mb-8 overflow-auto bg-white border border-gray-200 rounded-xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">Daily Summary (uses current filters)</h2>
      </div>
      <table className="min-w-full text-sm">
        <thead className="text-xs text-gray-600 uppercase bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-left">Employee Name</th>
            <th className="px-3 py-2 text-left">First Checkin</th>
            <th className="px-3 py-2 text-left">Last Checkout</th>
            <th className="px-3 py-2 text-left">Date</th>
            <th className="px-3 py-2 text-left">Total hours as break taken</th>
            <th className="px-3 py-2 text-left">Total No. of Hours Worked in 24hrs</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r, idx) => (
            <tr key={`summary-${r.employee_id}-${r.date}-${idx}`} className="hover:bg-gray-50">
              <td className="px-3 py-2 text-blue-700">
                <button
                  onClick={() => onSelect({ employee_id: r.employee_id, employee_name: r.employee_name, date: r.date })}
                  className="font-medium hover:underline"
                  title="View day logs"
                >
                  {r.employee_name}
                </button>
              </td>
              <td className="px-3 py-2 font-mono text-xs text-gray-700">{r.first_checkin || '-'}</td>
              <td className="px-3 py-2 font-mono text-xs text-gray-700">{r.last_checkout || (r.date === new Date().toISOString().split('T')[0] ? 'Pending' : '-')}</td>
              <td className="px-3 py-2 font-mono text-xs text-gray-700">{r.date}</td>
              <td className="px-3 py-2 text-gray-700">{formatHM(r.break_seconds)}</td>
              <td className="px-3 py-2 text-gray-900">{formatHM(r.worked_seconds)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-gray-500">No data for current filters.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
