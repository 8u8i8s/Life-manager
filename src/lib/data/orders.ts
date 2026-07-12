import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type OrderListItem = Tables<"orders"> & {
  contacts: Pick<Tables<"contacts">, "id" | "full_name"> | null;
};

export type OrderDetail = Tables<"orders"> & {
  contacts: Tables<"contacts"> | null;
  quotes: Pick<Tables<"quotes">, "id" | "quote_number"> | null;
};

export async function getOrders(): Promise<OrderListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*, contacts(id, full_name)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load orders: ${error.message}`);
  }

  return data;
}

export async function getOrderById(id: string): Promise<OrderDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*, contacts(*), quotes(id, quote_number)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load order: ${error.message}`);
  }

  return data;
}
