-- Recreate attendance_records to allow new statuses and add break_duration_seconds
-- SQLite requires table recreation to alter CHECK constraint

BEGIN TRANSACTION;

-- 1. Create new table with desired schema
CREATE TABLE attendance_records_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  uuid TEXT NOT NULL,
  company_uuid TEXT,
  hex_value TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('checkin','checkout','short_break','lunch_break')),
  break_duration_seconds INTEGER NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  day_of_week TEXT,
  date TEXT,
  time TEXT,
  month TEXT,
  year INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Copy existing data (break_duration_seconds becomes NULL)
INSERT INTO attendance_records_new (
  id, employee_id, uuid, company_uuid, hex_value, status, recorded_at,
  day_of_week, date, time, month, year, created_at, updated_at
) SELECT 
  id, employee_id, uuid, company_uuid, hex_value, status, recorded_at,
  day_of_week, date, time, month, year, created_at, updated_at
FROM attendance_records;

-- 3. Drop old table
DROP TABLE attendance_records;

-- 4. Rename new table
ALTER TABLE attendance_records_new RENAME TO attendance_records;

-- 5. Recreate indexes
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_recorded_at ON attendance_records(recorded_at);
CREATE INDEX IF NOT EXISTS idx_attendance_uuid ON attendance_records(uuid);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_company_uuid ON attendance_records(company_uuid);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_records(employee_id, date);

COMMIT;
