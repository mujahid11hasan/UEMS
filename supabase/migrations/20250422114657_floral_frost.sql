/*
  # Improve Role Handling

  1. Changes
    - Add function to automatically assign admin role for specific email
    - Update handle_new_user function to handle admin role assignment
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role text;
BEGIN
  -- Check if the email is admin@university.com
  IF new.email = 'admin@university.com' THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := new.raw_user_meta_data->>'role';
  END IF;

  INSERT INTO public.profiles (id, name, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    assigned_role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;