
-- Create new table for extended employee details
CREATE TABLE employee_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL UNIQUE,
  hex_value TEXT UNIQUE,
  role TEXT DEFAULT 'Employee',
  department TEXT DEFAULT 'General',
  emp_id TEXT,
  email TEXT,
  phone TEXT,
  hire_date DATE,
  manager TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_employee_details_hex_value ON employee_details(hex_value);
CREATE INDEX idx_employee_details_emp_id ON employee_details(emp_id);
CREATE INDEX idx_employee_details_role ON employee_details(role);
CREATE INDEX idx_employee_details_department ON employee_details(department);
