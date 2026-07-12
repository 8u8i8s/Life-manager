import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type TeamMember = Pick<Tables<"profiles">, "id" | "full_name" | "role">;

export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .order("full_name");

  if (error) {
    throw new Error(`Failed to load team members: ${error.message}`);
  }

  return data;
}
