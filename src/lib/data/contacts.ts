import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export async function getContacts(): Promise<Tables<"contacts">[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load contacts: ${error.message}`);
  }

  return data;
}
