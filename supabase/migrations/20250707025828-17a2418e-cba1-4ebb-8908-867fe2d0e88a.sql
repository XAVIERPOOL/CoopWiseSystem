-- Create function to handle officer enrollment
CREATE OR REPLACE FUNCTION public.enroll_officer_in_training(
  p_training_id UUID,
  p_officer_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert the enrollment record
  INSERT INTO training_registrations (training_id, officer_id)
  VALUES (p_training_id, p_officer_id)
  ON CONFLICT (training_id, officer_id) DO NOTHING;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;