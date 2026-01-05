-- Insert sample profiles (officers and admin) for testing
INSERT INTO profiles (id, username, full_name, role, cooperative, position, user_id_display) VALUES
('11111111-1111-1111-1111-111111111111', 'admin.user', 'Admin User', 'admin', 'System Admin', 'Administrator', 'ADMIN-001'),
('22222222-2222-2222-2222-222222222222', 'officer.one', 'Juan Miguel Santos', 'officer', 'Metro Manila Cooperative', 'Board Member', 'OFF-001'),
('33333333-3333-3333-3333-333333333333', 'officer.two', 'Maria Elena Rodriguez', 'officer', 'Northern Luzon Cooperative', 'Secretary', 'OFF-002'),
('44444444-4444-4444-4444-444444444444', 'officer.three', 'Roberto Cruz', 'officer', 'Central Visayas Cooperative', 'Treasurer', 'OFF-003'),
('55555555-5555-5555-5555-555555555555', 'officer.four', 'Ana Cristina Dela Cruz', 'officer', 'Mindanao Development Cooperative', 'Chairman', 'OFF-004')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  cooperative = EXCLUDED.cooperative,
  position = EXCLUDED.position,
  user_id_display = EXCLUDED.user_id_display;

-- Insert sample training events
INSERT INTO trainings (id, training_id, title, topic, date, time, venue, speaker, capacity, status) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'TRN-2024-001', 'Financial Management Basics', 'Financial Management', '2024-01-15', '14:00', 'Conference Room A', 'Dr. Maria Santos', 30, 'ongoing'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'TRN-2024-002', 'Digital Marketing for Coops', 'Marketing', '2024-01-20', '10:00', 'Training Center B', 'Prof. Juan Dela Cruz', 25, 'upcoming'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'TRN-2024-003', 'Risk Management Workshop', 'Risk Management', '2024-01-25', '09:00', 'Main Auditorium', 'Atty. Rosa Garcia', 40, 'upcoming'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'TRN-2024-004', 'Cooperative Governance', 'Governance', '2024-01-30', '13:00', 'Board Room', 'Ms. Carmen Reyes', 20, 'upcoming')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  topic = EXCLUDED.topic,
  date = EXCLUDED.date,
  time = EXCLUDED.time,
  venue = EXCLUDED.venue,
  speaker = EXCLUDED.speaker,
  capacity = EXCLUDED.capacity,
  status = EXCLUDED.status;

-- Insert sample enrollments
INSERT INTO training_registrations (training_id, officer_id) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '55555555-5555-5555-5555-555555555555')
ON CONFLICT (training_id, officer_id) DO NOTHING;

-- Insert sample attendance records
INSERT INTO attendance (officer_id, training_id, recorded_at, method) VALUES
('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now(), 'manual'),
('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now(), 'qr')
ON CONFLICT (officer_id, training_id) DO NOTHING;