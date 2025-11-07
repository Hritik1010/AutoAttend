-- Add working_mode to employee_details
ALTER TABLE employee_details ADD COLUMN working_mode TEXT DEFAULT 'Office';

-- Optional: index if filtering frequently
-- CREATE INDEX idx_employee_details_working_mode ON employee_details(working_mode);
