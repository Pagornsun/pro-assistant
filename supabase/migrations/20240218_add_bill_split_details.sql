-- Add bill_split_details to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS bill_split_details JSONB;

-- Comment on column
COMMENT ON COLUMN tasks.bill_split_details IS 'JSON containing bill splitting details (total, payers, etc.)';
