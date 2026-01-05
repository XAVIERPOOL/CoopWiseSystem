-- Add public read access to training registrations so enrollment counts are visible
-- This allows displaying which officers are enrolled in which trainings
CREATE POLICY "Anyone can view training registrations"
ON public.training_registrations
FOR SELECT
USING (true);

-- This is safe because it only shows enrollment relationships, not sensitive data