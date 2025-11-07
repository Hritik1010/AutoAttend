import z from "zod";

// Enhanced Employee schema with detailed information
export const EmployeeSchema = z.object({
  id: z.number(),
  name: z.string(),
  uuid: z.string(), // Company UUID
  is_active: z.number().int(), // 0 or 1
  created_at: z.string(),
  updated_at: z.string(),
});

export type Employee = z.infer<typeof EmployeeSchema>;

// Employee Details schema for HR/admin management
export const EmployeeDetailsSchema = z.object({
  id: z.number(),
  employee_id: z.number(),
  hex_value: z.string().nullable(),
  role: z.string(),
  department: z.string(),
  working_mode: z.string().optional().nullable(),
  emp_id: z.string().nullable(), // Employee ID/Badge number
  email: z.string().nullable(),
  phone: z.string().nullable(),
  hire_date: z.string().nullable(), // DATE format
  manager: z.string().nullable(),
  location: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type EmployeeDetails = z.infer<typeof EmployeeDetailsSchema>;

// Enhanced Employee with Details (for API responses)
export const EmployeeWithDetailsSchema = EmployeeSchema.extend({
  details: EmployeeDetailsSchema.nullable(),
});

export type EmployeeWithDetails = z.infer<typeof EmployeeWithDetailsSchema>;

// Enhanced attendance record schema with detailed timestamp breakdown
export const AttendanceRecordSchema = z.object({
  id: z.number(),
  employee_id: z.number(),
  company_uuid: z.string(),
  hex_value: z.string(), // Employee name in hex format
  status: z.enum(['checkin', 'checkout']),
  recorded_at: z.string(), // ISO timestamp
  day_of_week: z.string().optional(), // Monday, Tuesday, etc.
  date: z.string().optional(), // YYYY-MM-DD
  time: z.string().optional(), // HH:MM:SS
  month: z.string().optional(), // January, February, etc.
  year: z.number().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type AttendanceRecord = z.infer<typeof AttendanceRecordSchema>;

// Enhanced attendance record with employee name and details (for API responses)
export const AttendanceRecordWithEmployeeSchema = AttendanceRecordSchema.extend({
  employee_name: z.string(),
  employee_role: z.string().optional(),
  employee_department: z.string().optional(),
  employee_emp_id: z.string().optional(),
});

export type AttendanceRecordWithEmployee = z.infer<typeof AttendanceRecordWithEmployeeSchema>;

// API request schemas
export const CreateEmployeeSchema = z.object({
  name: z.string().min(1),
  uuid: z.string().min(1),
  hex_value: z.string().min(1), // Employee name in hex
  role: z.string().min(1),
  department: z.string().min(1),
  working_mode: z.enum(['WorkFromHome','Hybrid','Office']).optional(),
  emp_id: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  hire_date: z.string().optional(), // YYYY-MM-DD format
  manager: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

// Partial update schema for editing employee and details
export const UpdateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  hex_value: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  working_mode: z.enum(['WorkFromHome','Hybrid','Office']).optional(),
  emp_id: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  hire_date: z.string().optional(), // YYYY-MM-DD format
  manager: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.number().int().optional(),
});

// ESP32 detection schema - hex value is required; optional action for checkout
export const ESP32DetectionSchema = z.object({
  hex_value: z.string(),
  action: z.enum(['checkin', 'checkout']).optional(),
});

// Attendance statistics schema
export const AttendanceStatsSchema = z.object({
  today_checkins: z.number(),
  currently_present: z.number(),
  total_employees: z.number(),
  date: z.string(),
});

export type CreateEmployeeRequest = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeRequest = z.infer<typeof UpdateEmployeeSchema>;
export type ESP32DetectionRequest = z.infer<typeof ESP32DetectionSchema>;
export type AttendanceStats = z.infer<typeof AttendanceStatsSchema>;

// Employee validation helpers
export const EmployeeRoles = [
  'Employee',
  'Manager',
  'Supervisor',
  'Team Lead',
  'Director',
  'VP',
  'Executive',
  'Intern',
  'Contractor',
  'Consultant'
] as const;

export const EmployeeDepartments = [
  'General',
  'Human Resources',
  'Engineering',
  'Project Coordinator',
  'Project Manager',
  'UI/UX Designer',
  'Sales',
  'Marketing',
  'Finance',
  'Operations',
  'Customer Support',
  'Legal',
  'IT',
  'IOT/Embedded Developer',
  'IOT/Embedded App Developer',
  'Product',
  'Design',
  'Research',
  'Quality Assurance'
] as const;

export const WorkingModes = [
  'WorkFromHome',
  'Hybrid',
  'Office'
] as const;
