-- Add line_group_id to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS line_group_id TEXT;

-- Comment on column
COMMENT ON COLUMN tasks.line_group_id IS 'LINE Group ID or Room ID if the task was created in a group context';
