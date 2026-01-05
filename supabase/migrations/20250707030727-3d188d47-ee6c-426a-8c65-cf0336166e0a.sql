-- Drop ALL existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all operations on profiles" ON profiles;

DROP POLICY IF EXISTS "Users can view all trainings" ON trainings;
DROP POLICY IF EXISTS "Admins can manage trainings" ON trainings;
DROP POLICY IF EXISTS "Allow all operations on trainings" ON trainings;

DROP POLICY IF EXISTS "Users can view all attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can manage attendance" ON attendance;
DROP POLICY IF EXISTS "Allow all operations on attendance" ON attendance;

DROP POLICY IF EXISTS "Users can view all training_registrations" ON training_registrations;
DROP POLICY IF EXISTS "Admins can manage training_registrations" ON training_registrations;
DROP POLICY IF EXISTS "Allow all operations on training_registrations" ON training_registrations;

-- Create a security definer function to check user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create NEW proper RLS policies for profiles
CREATE POLICY "profiles_select_policy" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

CREATE POLICY "profiles_update_own_policy" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "profiles_admin_manage_policy" 
  ON public.profiles 
  FOR ALL 
  USING (public.get_current_user_role() = 'admin');

-- Create NEW proper policies for trainings
CREATE POLICY "trainings_select_policy" 
  ON public.trainings 
  FOR SELECT 
  USING (true);

CREATE POLICY "trainings_admin_manage_policy" 
  ON public.trainings 
  FOR ALL 
  USING (public.get_current_user_role() = 'admin');

-- Create NEW proper policies for attendance
CREATE POLICY "attendance_select_policy" 
  ON public.attendance 
  FOR SELECT 
  USING (true);

CREATE POLICY "attendance_admin_manage_policy" 
  ON public.attendance 
  FOR ALL 
  USING (public.get_current_user_role() = 'admin');

-- Create NEW proper policies for training_registrations
CREATE POLICY "training_registrations_select_policy" 
  ON public.training_registrations 
  FOR SELECT 
  USING (true);

CREATE POLICY "training_registrations_admin_manage_policy" 
  ON public.training_registrations 
  FOR ALL 
  USING (public.get_current_user_role() = 'admin');