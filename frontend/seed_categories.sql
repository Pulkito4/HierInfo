-- Complete setup for categories and profiles tables
-- Run this in Supabase SQL editor

-- First, ensure RLS is enabled and create policies for categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read categories (public access)
CREATE POLICY "Enable read access for all users" ON "public"."categories"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

-- Ensure profiles table has proper RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read and update their own profile
CREATE POLICY "Users can view their own profile" ON "public"."profiles"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON "public"."profiles"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON "public"."profiles"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Sample categories for your news app
INSERT INTO categories (id, name) VALUES 
('1', 'Technology'),
('2', 'Sports'), 
('3', 'Politics'),
('4', 'Business'),
('5', 'Entertainment'),
('6', 'Health'),
('7', 'Science'),
('8', 'World News')
ON CONFLICT (id) DO NOTHING;