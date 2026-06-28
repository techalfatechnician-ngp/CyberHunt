-- Supabase Schema for CyberHunt CTF (UPDATED FOR NON-LINEAR DASHBOARD)

-- Drop existing tables if they were created incorrectly
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS levels CASCADE;
DROP TABLE IF EXISTS event_settings CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;

-- 1. Create teams table
CREATE TABLE teams (
    team_id TEXT PRIMARY KEY,
    team_name TEXT NOT NULL,
    leader_email TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    ai_strikes INTEGER DEFAULT 0,
    global_hints_used INTEGER DEFAULT 0,
    fragments TEXT[] DEFAULT ARRAY['','','','','','','','',''],
    last_submission_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    is_disqualified BOOLEAN DEFAULT FALSE
);

-- 2. Create submissions table
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id TEXT REFERENCES teams(team_id) ON DELETE CASCADE,
    team_name TEXT NOT NULL,
    level_id INTEGER NOT NULL,
    answer TEXT NOT NULL,
    proof_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create levels table
CREATE TABLE levels (
    level_id INTEGER PRIMARY KEY,
    hint_1 TEXT,
    hint_link TEXT
);

-- 4. Create event_settings table
CREATE TABLE event_settings (
    id TEXT PRIMARY KEY,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 5. Create activity_logs table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Configuration
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
