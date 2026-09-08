import { createServerDbClient } from '@/lib/db/supabase-server';

export async function getCurrentUser() {
  try {
    const supabase = await createServerDbClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }
    return user;
  } catch (err) {
    return null;
  }
}

export async function getUserProfile(userId: string) {
  try {
    const supabase = await createServerDbClient();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return null;
    return profile;
  } catch (err) {
    return null;
  }
}
