-- Rebuild employees table to remove UNIQUE constraint on uuid
-- This allows using the same company UUID (e.g., D7E1A3F4) for all employees

PRAGMA foreign_keys=off;

-- 1) Create new table without UNIQUE constraint
CREATE TABLE employees_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  uuid TEXT NOT NULL,
  hex_value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2) Copy data
INSERT INTO employees_new (id, name, uuid, hex_value, is_active, created_at, updated_at)
SELECT id, name, uuid, hex_value, is_active, created_at, updated_at FROM employees;

-- 3) Drop old table and rename new one
DROP TABLE employees;
ALTER TABLE employees_new RENAME TO employees;

-- 4) Recreate indexes (non-unique)
CREATE INDEX IF NOT EXISTS idx_employees_uuid ON employees(uuid);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);

PRAGMA foreign_keys=on;
