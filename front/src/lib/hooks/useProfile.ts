import { useEffect, useState } from "react";
import { useSupabase } from "./useSupabase";
import { useAuth } from "./useAuth";

interface Profile {
  id: string;
  role: 'customer' | 'worker' | 'manager';
  username: string;
  email: string;
}

export function useProfile() {
  const supabase = useSupabase();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  async function loadProfile() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, username, email")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("error loading profile:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  return { profile, loading };
} 