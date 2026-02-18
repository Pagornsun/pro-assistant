-- Add tags column to tasks table
ALTER TABLE tasks ADD COLUMN tags TEXT[] DEFAULT '{}';
