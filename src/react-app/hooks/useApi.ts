import { useState, useEffect } from 'react';
import type { EmployeeWithDetails, AttendanceRecordWithEmployee, AttendanceStats, CreateEmployeeRequest } from '@/shared/types';

const API_BASE = '';

export function useEmployees() {
  const [employees, setEmployees] = useState<EmployeeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/employees`);
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const createEmployee = async (employeeData: CreateEmployeeRequest) => {
    try {
      const response = await fetch(`${API_BASE}/api/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create employee');
      }
      const newEmployee = await response.json();
      setEmployees(prev => [...prev, newEmployee]);
      return newEmployee;
    } catch (err) {
      throw err;
    }
  };

  return { employees, loading, error, createEmployee, refetch: fetchEmployees };
}

export function useAttendance(limit?: number) {
  const [attendance, setAttendance] = useState<AttendanceRecordWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const url = limit ? `${API_BASE}/api/attendance?limit=${limit}` : `${API_BASE}/api/attendance`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch attendance');
      const data = await response.json();
      setAttendance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [limit]);

  return { attendance, loading, error, refetch: fetchAttendance };
}

export function useAttendanceStats() {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/attendance/stats`);
      if (!response.ok) throw new Error('Failed to fetch attendance stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 30 seconds for real-time updates
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error, refetch: fetchStats };
}
