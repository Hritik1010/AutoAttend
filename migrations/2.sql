
-- Add detailed timestamp columns to attendance_records table
ALTER TABLE attendance_records ADD COLUMN company_uuid TEXT;
ALTER TABLE attendance_records ADD COLUMN day_of_week TEXT;
ALTER TABLE attendance_records ADD COLUMN date TEXT;
ALTER TABLE attendance_records ADD COLUMN time TEXT;
ALTER TABLE attendance_records ADD COLUMN month TEXT;
ALTER TABLE attendance_records ADD COLUMN year INTEGER;

-- Update existing records to use company_uuid from uuid column
UPDATE attendance_records SET company_uuid = uuid WHERE company_uuid IS NULL;

-- Create indexes for faster queries
CREATE INDEX idx_attendance_date ON attendance_records(date);
CREATE INDEX idx_attendance_company_uuid ON attendance_records(company_uuid);
CREATE INDEX idx_attendance_employee_date ON attendance_records(employee_id, date);
