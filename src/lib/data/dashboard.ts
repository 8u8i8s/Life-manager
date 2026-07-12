import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type DashboardStats = {
  totalInquiries: number;
  newInquiries: number;
  totalContacts: number;
};

export type RecentInquiry = Pick<
  Tables<"inquiries">,
  "id" | "subject" | "status" | "source" | "received_at"
>;

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const [totalInquiries, newInquiries, totalContacts] = await Promise.all([
    supabase.from("inquiries").select("id", { count: "exact", head: true }),
    supabase
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
    supabase.from("contacts").select("id", { count: "exact", head: true }),
  ]);

  return {
    totalInquiries: totalInquiries.count ?? 0,
    newInquiries: newInquiries.count ?? 0,
    totalContacts: totalContacts.count ?? 0,
  };
}

export async function getRecentInquiries(
  limit = 5
): Promise<RecentInquiry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inquiries")
    .select("id, subject, status, source, received_at")
    .order("received_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load recent inquiries: ${error.message}`);
  }

  return data;
}
