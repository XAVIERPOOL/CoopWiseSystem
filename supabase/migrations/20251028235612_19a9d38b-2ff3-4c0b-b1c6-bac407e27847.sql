-- Delete existing sample data
DELETE FROM attendance WHERE training_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
);

DELETE FROM training_registrations WHERE training_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
);

DELETE FROM trainings WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
);

DELETE FROM profiles WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
);

-- Insert sample profiles (officers and admin)
INSERT INTO profiles (id, username, full_name, role, cooperative, position, user_id_display) VALUES
('11111111-1111-1111-1111-111111111111', 'admin.user', 'Admin User', 'admin', 'System Admin', 'Administrator', 'ADMIN-001'),
('22222222-2222-2222-2222-222222222222', 'officer.one', 'Juan Miguel Santos', 'officer', 'Naciatrasco Cooperative', 'Board Member', 'OFF-001'),
('33333333-3333-3333-3333-333333333333', 'officer.two', 'Maria Elena Rodriguez', 'officer', 'Capatransco Cooperative', 'Secretary', 'OFF-002'),
('44444444-4444-4444-4444-444444444444', 'officer.three', 'Roberto Cruz', 'officer', 'Aidvantage Cooperative', 'Treasurer', 'OFF-003'),
('55555555-5555-5555-5555-555555555555', 'officer.four', 'Ana Cristina Dela Cruz', 'officer', 'Arise Cooperative', 'Chairman', 'OFF-004');

-- Insert sample trainings with appropriate dates
-- Completed training (past)
INSERT INTO trainings (id, training_id, title, topic, date, start_date, end_date, time, venue, speaker, capacity, status) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'TRN-2024-005', 'Leadership Excellence Workshop', 'Leadership Development', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '10 days', '09:00', 'Grand Conference Hall', 'Dr. Pedro Martinez', 35, 'completed');

-- Ongoing training (current)
INSERT INTO trainings (id, training_id, title, topic, date, start_date, end_date, time, venue, speaker, capacity, status) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'TRN-2024-001', 'Financial Management Basics', 'Financial Management', CURRENT_DATE, CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '2 days', '14:00', 'Conference Room A', 'Dr. Maria Santos', 30, 'ongoing');

-- Upcoming trainings (future)
INSERT INTO trainings (id, training_id, title, topic, date, start_date, end_date, time, venue, speaker, capacity, status) VALUES
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

-- Insert attendance for completed training (all enrolled officers attended)
INSERT INTO attendance (officer_id, training_id, recorded_at, recorded_by, method) VALUES
('22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', CURRENT_TIMESTAMP - INTERVAL '10 days', '11111111-1111-1111-1111-111111111111', 'manual'),
('33333333-3333-3333-3333-333333333333', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', CURRENT_TIMESTAMP - INTERVAL '10 days', '11111111-1111-1111-1111-111111111111', 'qr'),
('44444444-4444-4444-4444-444444444444', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', CURRENT_TIMESTAMP - INTERVAL '10 days', '11111111-1111-1111-1111-111111111111', 'manual'),
('55555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', CURRENT_TIMESTAMP - INTERVAL '10 days', '11111111-1111-1111-1111-111111111111', 'qr');

-- Insert attendance for ongoing training (partial attendance)
INSERT INTO attendance (officer_id, training_id, recorded_at, recorded_by, method) VALUES
('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_TIMESTAMP - INTERVAL '1 day', '11111111-1111-1111-1111-111111111111', 'manual'),
('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_TIMESTAMP - INTERVAL '1 day', '11111111-1111-1111-1111-111111111111', 'qr');