-- Fix Missing Columns in Tasks Table
-- Detected during Phase 2 Verification

-- 1. Add due_date if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'due_date') THEN 
        ALTER TABLE tasks ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
    END IF; 
END $$;

-- 2. Add tags if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'tags') THEN 
        ALTER TABLE tasks ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF; 
END $$;

-- 3. Add priority if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'priority') THEN 
        ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'medium';
    END IF; 
END $$;
