-- Create the training_registrations table first
CREATE TABLE IF NOT EXISTS public.training_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  training_id UUID REFERENCES trainings(id) ON DELETE CASCADE NOT NULL,
  officer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(training_id, officer_id)
);

-- Enable RLS on training_registrations
ALTER TABLE training_registrations ENABLE ROW LEVEL SECURITY;

-- Fix the time column issue
ALTER TABLE trainings DROP COLUMN IF EXISTS time;
ALTER TABLE trainings ADD COLUMN time TIME;

-- Drop ALL existing problematic policies
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

-- Create a security definer function to check user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create simple, non-recursive policies
CREATE POLICY "profiles_select_policy" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

CREATE POLICY "profiles_update_own_policy" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "trainings_select_policy" 
  ON public.trainings 
  FOR SELECT 
  USING (true);

CREATE POLICY "trainings_insert_policy" 
  ON public.trainings 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "trainings_update_policy" 
  ON public.trainings 
  FOR UPDATE 
  USING (true);

CREATE POLICY "trainings_delete_policy" 
  ON public.trainings 
  FOR DELETE 
  USING (true);

CREATE POLICY "attendance_select_policy" 
  ON public.attendance 
  FOR SELECT 
  USING (true);

CREATE POLICY "attendance_insert_policy" 
  ON public.attendance 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "attendance_update_policy" 
  ON public.attendance 
  FOR UPDATE 
  USING (true);

CREATE POLICY "attendance_delete_policy" 
  ON public.attendance 
  FOR DELETE 
  USING (true);

CREATE POLICY "training_registrations_select_policy" 
  ON public.training_registrations 
  FOR SELECT 
  USING (true);

CREATE POLICY "training_registrations_insert_policy" 
  ON public.training_registrations 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "training_registrations_update_policy" 
  ON public.training_registrations 
  FOR UPDATE 
  USING (true);

CREATE POLICY "training_registrations_delete_policy" 
  ON public.training_registrations 
  FOR DELETE 
  USING (true);