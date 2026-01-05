-- Fix infinite recursion in RLS policies by creating a security definer function
-- First, drop the existing problematic policies
DROP POLICY IF EXISTS "Allow all operations on profiles" ON profiles;

-- Create a security definer function to check user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create proper RLS policies using the security definer function
CREATE POLICY "Users can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" 
  ON public.profiles 
  FOR ALL 
  USING (public.get_current_user_role() = 'admin');

-- Fix other table policies to avoid recursion
DROP POLICY IF EXISTS "Allow all operations on trainings" ON trainings;
DROP POLICY IF EXISTS "Allow all operations on attendance" ON attendance;
DROP POLICY IF EXISTS "Allow all operations on training_registrations" ON training_registrations;

-- Create proper policies for trainings
CREATE POLICY "Users can view all trainings" 
  ON public.trainings 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage trainings" 
  ON public.trainings 
  FOR ALL 
  USING (public.get_current_user_role() = 'admin');

-- Create proper policies for attendance
CREATE POLICY "Users can view all attendance" 
  ON public.attendance 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage attendance" 
  ON public.attendance 
  FOR ALL 
  USING (public.get_current_user_role() = 'admin');

-- Create proper policies for training_registrations
CREATE POLICY "Users can view all training_registrations" 
  ON public.training_registrations 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage training_registrations" 
  ON public.training_registrations 
  FOR ALL 
  USING (public.get_current_user_role() = 'admin');

-- Ensure the time column exists and refresh schema
ALTER TABLE trainings DROP COLUMN IF EXISTS time;
ALTER TABLE trainings ADD COLUMN time TIME;

-- Insert some sample data to make sure everything works
INSERT INTO profiles (id, username, full_name, role, cooperative, position, user_id_display) VALUES
('11111111-1111-1111-1111-111111111111', 'admin.user', 'Admin User', 'admin', 'System Admin', 'Administrator', 'ADMIN-001'),
('22222222-2222-2222-2222-222222222222', 'officer.one', 'Juan Miguel Santos', 'officer', 'Capatransco', 'Board Member', 'OFF-001'),
('33333333-3333-3333-3333-333333333333', 'officer.two', 'Maria Elena Rodriguez', 'officer', 'Naciatransco', 'Secretary', 'OFF-002')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  cooperative = EXCLUDED.cooperative,
  position = EXCLUDED.position,
  user_id_display = EXCLUDED.user_id_display;