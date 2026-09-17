-- ============================================================
-- SUPABASE DATABASE MIGRATION SCRIPT FOR WIRELESS DATA PORTAL
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ============================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    is_primary_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Primary Admin Account (NOFEAR / NOFEAR009)
INSERT INTO public.users (id, username, password, role, is_primary_admin)
VALUES ('usr_nofear', 'NOFEAR', 'NOFEAR009', 'admin', TRUE)
ON CONFLICT (username) DO NOTHING;

-- 2. APPROVED DATA RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.data_records (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content JSONB NOT NULL,
    submitted_by TEXT DEFAULT 'Public User',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PENDING APPROVALS QUEUE TABLE
CREATE TABLE IF NOT EXISTS public.pending_approvals (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'ADD' or 'DELETE'
    target_id TEXT,
    requested_by TEXT DEFAULT 'Public User',
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SECURITY AUDIT & TRACKER LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip TEXT,
    username TEXT,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    device TEXT,
    details JSONB
);

-- ENABLE ROW LEVEL SECURITY (Optional/Disabled for simple API access)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_approvals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
