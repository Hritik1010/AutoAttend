
CREATE TABLE employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  uuid TEXT NOT NULL UNIQUE,
  hex_value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendance_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  uuid TEXT NOT NULL,
  hex_value TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('checkin', 'checkout')),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employees_uuid ON employees(uuid);
CREATE INDEX idx_employees_active ON employees(is_active);
CREATE INDEX idx_attendance_employee_id ON attendance_records(employee_id);
CREATE INDEX idx_attendance_recorded_at ON attendance_records(recorded_at);
CREATE INDEX idx_attendance_uuid ON attendance_records(uuid);
