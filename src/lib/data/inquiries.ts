import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type InquiryListItem = Tables<"inquiries"> & {
  contacts: Pick<Tables<"contacts">, "id" | "full_name" | "email"> | null;
};

export async function getInquiries(): Promise<InquiryListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inquiries")
    .select("*, contacts(id, full_name, email)")
    .order("received_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load inquiries: ${error.message}`);
  }

  return data;
}
