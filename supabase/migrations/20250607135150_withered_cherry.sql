/*
  # Create automatic user profile creation trigger

  1. New Functions
    - `handle_new_user()` - Automatically creates a user profile when a new user signs up

  2. New Triggers
    - `on_auth_user_created` - Triggers the profile creation function after user signup

  3. Security
    - Function runs with SECURITY DEFINER to bypass RLS during profile creation
    - Ensures every new user gets a profile entry automatically
*/

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();