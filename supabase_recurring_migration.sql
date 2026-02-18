-- Add recurring_config column to tasks table
-- Structure: { "frequency": "daily" | "weekly" | "monthly", "interval": number }
ALTER TABLE tasks ADD COLUMN recurring_config JSONB;
