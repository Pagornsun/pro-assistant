-- Add reminder tracking columns to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS is_reminded_1h BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_reminded_24h BOOLEAN DEFAULT FALSE;

-- Comment on columns
COMMENT ON COLUMN tasks.is_reminded_1h IS 'Flag to indicate if 1-hour reminder has been sent';
COMMENT ON COLUMN tasks.is_reminded_24h IS 'Flag to indicate if 24-hour reminder has been sent';
