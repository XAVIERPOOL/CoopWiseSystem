--  start_date and end_date columns to trainings table
ALTER TABLE public.trainings ADD COLUMN start_date date;
ALTER TABLE public.trainings ADD COLUMN end_date date;

-- Update existing records to use the existing date column as start_date
UPDATE public.trainings SET start_date = date WHERE start_date IS NULL;

-- start_date required
ALTER TABLE public.trainings ALTER COLUMN start_date SET NOT NULL;