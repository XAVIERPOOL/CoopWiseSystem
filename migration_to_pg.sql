-- CoopWise Training & seminar Module - Database Schema Migration
-- Migration script to set up PostgreSQL database schema for training management

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS companion_registrations CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS training_registrations CASCADE;
DROP TABLE IF EXISTS trainings CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS enroll_officer_in_training(UUID, UUID);

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  cooperative VARCHAR(255),
  position VARCHAR(255),
  user_id_display VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create trainings table
CREATE TABLE trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  time TIME,
  venue VARCHAR(255) NOT NULL,
  speaker VARCHAR(255) NOT NULL,
  capacity INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'upcoming',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create training_registrations table
CREATE TABLE training_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID REFERENCES trainings(id) ON DELETE CASCADE NOT NULL,
  officer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(training_id, officer_id)
);

-- Create attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  training_id UUID REFERENCES trainings(id) ON DELETE CASCADE,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  recorded_by UUID REFERENCES profiles(id),
  method VARCHAR(50),
  check_in_time TIME,
  UNIQUE(officer_id, training_id)
);

-- Create companion_registrations table
CREATE TABLE companion_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID REFERENCES trainings(id) ON DELETE CASCADE NOT NULL,
  officer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  companion_name TEXT NOT NULL,
  companion_email TEXT NOT NULL,
  companion_phone TEXT,
  companion_position TEXT,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_training_registrations_training_id ON training_registrations(training_id);
CREATE INDEX idx_training_registrations_officer_id ON training_registrations(officer_id);
CREATE INDEX idx_attendance_training_id ON attendance(training_id);
CREATE INDEX idx_attendance_officer_id ON attendance(officer_id);
CREATE INDEX idx_companion_registrations_training_id ON companion_registrations(training_id);
CREATE INDEX idx_companion_registrations_officer_id ON companion_registrations(officer_id);

-- Create function to handle officer enrollment
CREATE OR REPLACE FUNCTION enroll_officer_in_training(
  p_training_id UUID,
  p_officer_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO training_registrations (training_id, officer_id)
  VALUES (p_training_id, p_officer_id)
  ON CONFLICT (training_id, officer_id) DO NOTHING;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Insert sample profiles (officers and admin)
INSERT INTO profiles (id, username, full_name, role, cooperative, position, user_id_display) VALUES
('11111111-1111-1111-1111-111111111111', 'admin.user', 'Admin User', 'admin', 'System Admin', 'Administrator', 'ADMIN-001'),
('22222222-2222-2222-2222-222222222222', 'officer.one', 'Juan Miguel Santos', 'officer', 'Metro Manila Cooperative', 'Board Member', 'OFF-001'),
('33333333-3333-3333-3333-333333333333', 'officer.two', 'Maria Elena Rodriguez', 'officer', 'Northern Luzon Cooperative', 'Secretary', 'OFF-002'),
('44444444-4444-4444-4444-444444444444', 'officer.three', 'Roberto Cruz', 'officer', 'Central Visayas Cooperative', 'Treasurer', 'OFF-003'),
('55555555-5555-5555-5555-555555555555', 'officer.four', 'Ana Cristina Dela Cruz', 'officer', 'Mindanao Development Cooperative', 'Chairman', 'OFF-004');

-- Insert sample trainings with appropriate dates
INSERT INTO trainings (id, training_id, title, topic, date, start_date, end_date, time, venue, speaker, capacity, status) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'TRN-2024-005', 'Leadership Excellence Workshop', 'Leadership Development', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '10 days', '09:00', 'Grand Conference Hall', 'Dr. Pedro Martinez', 35, 'completed'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'TRN-2024-001', 'Financial Management Basics', 'Financial Management', CURRENT_DATE, CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '2 days', '14:00', 'Conference Room A', 'Dr. Maria Santos', 30, 'ongoing'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'TRN-2024-002', 'Digital Marketing for Coops', 'Marketing', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '7 days', '10:00', 'Training Center B', 'Prof. Juan Dela Cruz', 25, 'upcoming'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'TRN-2024-003', 'Risk Management Workshop', 'Risk Management', CURRENT_DATE + INTERVAL '15 days', CURRENT_DATE + INTERVAL '15 days', CURRENT_DATE + INTERVAL '16 days', '09:00', 'Main Auditorium', 'Atty. Rosa Garcia', 40, 'upcoming'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'TRN-2024-004', 'Cooperative Governance', 'Governance', CURRENT_DATE + INTERVAL '25 days', CURRENT_DATE + INTERVAL '25 days', CURRENT_DATE + INTERVAL '26 days', '13:00', 'Board Room', 'Ms. Carmen Reyes', 20, 'upcoming');

-- Insert enrollments for completed training
INSERT INTO training_registrations (training_id, officer_id, registered_at) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', CURRENT_TIMESTAMP - INTERVAL '15 days'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', CURRENT_TIMESTAMP - INTERVAL '15 days'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '44444444-4444-4444-4444-444444444444', CURRENT_TIMESTAMP - INTERVAL '15 days'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '55555555-5555-5555-5555-555555555555', CURRENT_TIMESTAMP - INTERVAL '15 days');

-- Insert enrollments for ongoing training
INSERT INTO training_registrations (training_id, officer_id, registered_at) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', CURRENT_TIMESTAMP - INTERVAL '5 days');

-- Insert enrollments for upcoming trainings
INSERT INTO training_registrations (training_id, officer_id, registered_at) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', CURRENT_TIMESTAMP),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', CURRENT_TIMESTAMP),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', CURRENT_TIMESTAMP),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444', CURRENT_TIMESTAMP),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '55555555-5555-5555-5555-555555555555', CURRENT_TIMESTAMP),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', CURRENT_TIMESTAMP),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', CURRENT_TIMESTAMP);

-- Insert attendance for completed training
INSERT INTO attendance (officer_id, training_id, recorded_at, recorded_by, method) VALUES
('22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', CURRENT_TIMESTAMP - INTERVAL '10 days', '11111111-1111-1111-1111-111111111111', 'manual'),
('33333333-3333-3333-3333-333333333333', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', CURRENT_TIMESTAMP - INTERVAL '10 days', '11111111-1111-1111-1111-111111111111', 'qr'),
('44444444-4444-4444-4444-444444444444', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', CURRENT_TIMESTAMP - INTERVAL '10 days', '11111111-1111-1111-1111-111111111111', 'manual'),
('55555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', CURRENT_TIMESTAMP - INTERVAL '10 days', '11111111-1111-1111-1111-111111111111', 'qr');

-- Insert attendance for ongoing training
INSERT INTO attendance (officer_id, training_id, recorded_at, recorded_by, method) VALUES
('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_TIMESTAMP - INTERVAL '1 day', '11111111-1111-1111-1111-111111111111', 'manual'),
('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_TIMESTAMP - INTERVAL '1 day', '11111111-1111-1111-1111-111111111111', 'qr');
