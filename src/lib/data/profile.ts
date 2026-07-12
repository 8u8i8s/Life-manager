import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type CurrentUserContext = {
  userId: string;
  email: string;
  profile: Tables<"profiles">;
  company: Tables<"companies"> | null;
};

/**
 * Loads the signed-in user together with their profile and company.
 * Returns null when there is no authenticated user.
 * Wrapped in `cache` so layout and pages share one lookup per request.
 */
export const getCurrentUserContext = cache(
  async (): Promise<CurrentUserContext | null> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*, companies(*)")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      return null;
    }

    const { companies: company, ...profileRow } = profile;

    return {
      userId: user.id,
      email: user.email ?? "",
      profile: profileRow,
      company,
    };
  }
);
