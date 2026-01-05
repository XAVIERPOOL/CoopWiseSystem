
-- Update the attendance table to include check-in time
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS check_in_time TIME;

-- Update the trainings table to include time field if not exists
ALTER TABLE trainings ADD COLUMN IF NOT EXISTS time TIME;

-- Create or update training registrations table to track who is registered for which training
CREATE TABLE IF NOT EXISTS training_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  training_id UUID REFERENCES trainings(id) NOT NULL,
  officer_id UUID REFERENCES profiles(id) NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(training_id, officer_id)
);

-- Enable RLS on training_registrations
ALTER TABLE training_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies for training_registrations
CREATE POLICY "Allow all operations on training_registrations" 
  ON training_registrations 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Enable RLS on attendance table
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for attendance
CREATE POLICY "Allow all operations on attendance" 
  ON attendance 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Create policies for trainings
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on trainings" 
  ON trainings 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Create policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on profiles" 
  ON profiles 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Insert some sample training data
INSERT INTO trainings (training_id, title, topic, date, time, venue, speaker, capacity, status) VALUES
('TRN-2024-001', 'Financial Management Basics', 'Financial Management', '2024-01-15', '14:00', 'Conference Room A', 'Dr. Maria Santos', 30, 'ongoing'),
('TRN-2024-002', 'Digital Marketing for Coops', 'Marketing', '2024-01-20', '10:00', 'Training Center B', 'Prof. Juan Dela Cruz', 25, 'upcoming'),
('TRN-2024-003', 'Risk Management Workshop', 'Risk Management', '2024-01-25', '09:00', 'Main Auditorium', 'Atty. Rosa Garcia', 40, 'upcoming')
ON CONFLICT (training_id) DO NOTHING;

-- Insert sample officers into profiles
INSERT INTO profiles (id, username, full_name, role, cooperative, position, user_id_display) VALUES
(gen_random_uuid(), 'juan.santos', 'Juan Miguel Santos', 'officer', 'Capatransco', 'Board Member', 'OFF-001'),
(gen_random_uuid(), 'maria.rodriguez', 'Maria Elena Rodriguez', 'officer', 'Naciatransco', 'Secretary', 'OFF-002'),
(gen_random_uuid(), 'roberto.cruz', 'Roberto Cruz', 'officer', 'Capatransco', 'Treasurer', 'OFF-003'),
(gen_random_uuid(), 'ana.delacruz', 'Ana Cristina Dela Cruz', 'officer', 'Magsaysay Transport Cooperative', 'Chairman', 'OFF-004')
ON CONFLICT (username) DO NOTHING;
