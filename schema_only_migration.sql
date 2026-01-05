-- CoopWise Training & Skills Module - Schema Only Migration


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
