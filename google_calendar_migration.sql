-- Add Google Calendar columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_email TEXT,
ADD COLUMN IF NOT EXISTS calendar_sync_enabled BOOLEAN DEFAULT false;

-- Add Google Event ID to tasks for sync
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS google_event_id TEXT;
