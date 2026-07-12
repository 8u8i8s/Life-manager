import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type InquiryListItem = Tables<"inquiries"> & {
  contacts: Pick<Tables<"contacts">, "id" | "full_name" | "email"> | null;
};

export type InquiryDetail = Tables<"inquiries"> & {
  contacts: Tables<"contacts"> | null;
  assignee: Pick<Tables<"profiles">, "id" | "full_name"> | null;
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

export async function getInquiryById(
  id: string
): Promise<InquiryDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inquiries")
    .select("*, contacts(*), assignee:profiles!inquiries_assigned_to_fkey(id, full_name)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load inquiry: ${error.message}`);
  }

  return data;
}
