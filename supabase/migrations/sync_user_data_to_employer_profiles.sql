-- Create a trigger function to synchronize data from the users table to the employer_profiles table.
CREATE OR REPLACE FUNCTION public.sync_user_data_to_employer_profiles()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if a corresponding record exists in employer_profiles.
  IF EXISTS (SELECT 1 FROM public.employer_profiles WHERE user_id = NEW.id) THEN
    -- Update the record in employer_profiles.
    UPDATE public.employer_profiles
    SET
      company_name = NEW.company_name,
      company_website = NEW.company_website,
      industry = NEW.industry,
      company_description = NEW.company_description,
      company_logo_url = NEW.company_logo_url,
      company_size = NEW.company_size,
      email = NEW.email
    WHERE user_id = NEW.id;
  ELSE
    -- Insert a new row into employer_profiles.
    INSERT INTO public.employer_profiles (
      user_id,
      company_name,
      company_website,
      industry,
      company_description,
      company_logo_url,
      company_size,
      email
    )
    VALUES (
      NEW.id,
      NEW.company_name,
      NEW.company_website,
      NEW.industry,
      NEW.company_description,
      NEW.company_logo_url,
      NEW.company_size,
      NEW.email
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a trigger that fires after an insert or update on the users table.
CREATE TRIGGER on_user_change
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.sync_user_data_to_employer_profiles();