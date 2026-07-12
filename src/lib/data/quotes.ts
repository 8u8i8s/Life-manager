import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type QuoteListItem = Tables<"quotes"> & {
  contacts: Pick<Tables<"contacts">, "id" | "full_name"> | null;
  quote_items: Pick<Tables<"quote_items">, "quantity" | "unit_price">[];
};

export type QuoteDetail = Tables<"quotes"> & {
  contacts: Tables<"contacts"> | null;
  inquiries: Pick<Tables<"inquiries">, "id" | "subject"> | null;
  quote_items: Tables<"quote_items">[];
};

export function quoteSubtotal(
  items: Pick<Tables<"quote_items">, "quantity" | "unit_price">[]
): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
}

export async function getQuotes(): Promise<QuoteListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quotes")
    .select(
      "*, contacts(id, full_name), quote_items(quantity, unit_price)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load quotes: ${error.message}`);
  }

  return data;
}

export async function getQuoteById(id: string): Promise<QuoteDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quotes")
    .select("*, contacts(*), inquiries(id, subject), quote_items(*)")
    .eq("id", id)
    .order("position", { referencedTable: "quote_items" })
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load quote: ${error.message}`);
  }

  return data;
}
