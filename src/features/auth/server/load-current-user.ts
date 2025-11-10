import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import type { CurrentUserSnapshot } from "../types";

const mapUser = (user: User, role?: string) => ({
  id: user.id,
  email: user.email,
  role,
  appMetadata: user.app_metadata ?? {},
  userMetadata: user.user_metadata ?? {},
});

export const loadCurrentUser = async (): Promise<CurrentUserSnapshot> => {
  const supabase = await createSupabaseServerClient();
  const result = await supabase.auth.getUser();
  const user = result.data.user;

  if (user) {
    // Fetch user profile from database to get role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    return {
      status: "authenticated",
      user: mapUser(user, (profile as any)?.role),
    };
  }

  return { status: "unauthenticated", user: null };
};
