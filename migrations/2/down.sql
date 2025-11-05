
-- Drop indexes in reverse order
DROP INDEX idx_attendance_employee_date;
DROP INDEX idx_attendance_company_uuid;
DROP INDEX idx_attendance_date;

-- Remove new columns from attendance_records in reverse order
ALTER TABLE attendance_records DROP COLUMN year;
ALTER TABLE attendance_records DROP COLUMN month;
ALTER TABLE attendance_records DROP COLUMN time;
ALTER TABLE attendance_records DROP COLUMN date;
ALTER TABLE attendance_records DROP COLUMN day_of_week;
ALTER TABLE attendance_records DROP COLUMN company_uuid;
