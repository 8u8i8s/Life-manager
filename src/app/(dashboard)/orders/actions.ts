"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentUserContext } from "@/lib/data/profile";
import { quoteSubtotal } from "@/lib/data/quotes";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/types/database";

export type OrderActionState = {
  error: string | null;
};

const orderStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(Constants.public.Enums.order_status),
});

/** Creates an order from a quote, marking the quote accepted. */
export async function createOrderFromQuote(
  quoteId: string
): Promise<OrderActionState> {
  const parsed = z.uuid().safeParse(quoteId);
  if (!parsed.success) {
    return { error: "Invalid quote id." };
  }

  const context = await getCurrentUserContext();
  if (!context?.company) {
    return { error: "Your account is not linked to a company." };
  }

  const supabase = await createClient();

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("*, quote_items(quantity, unit_price)")
    .eq("id", parsed.data)
    .maybeSingle();

  if (quoteError || !quote) {
    return { error: "Quote not found." };
  }

  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("quote_id", quote.id)
    .maybeSingle();
  if (existing) {
    return { error: "An order already exists for this quote." };
  }

  const { data: orderNumber, error: numberError } = await supabase.rpc(
    "next_order_number",
    { p_company_id: context.company.id }
  );
  if (numberError) {
    return { error: `Failed to allocate order number: ${numberError.message}` };
  }

  const subtotal = quoteSubtotal(quote.quote_items);
  const total = subtotal * (1 + quote.vat_rate / 100);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      company_id: context.company.id,
      created_by: context.userId,
      quote_id: quote.id,
      contact_id: quote.contact_id,
      order_number: orderNumber,
      currency: quote.currency,
      total: Math.round(total * 100) / 100,
      notes: quote.notes,
    })
    .select("id")
    .single();

  if (orderError) {
    return { error: `Failed to create order: ${orderError.message}` };
  }

  await supabase
    .from("quotes")
    .update({ status: "accepted" })
    .eq("id", quote.id);

  revalidatePath("/orders");
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quote.id}`);
  revalidatePath("/dashboard");
  redirect(`/orders/${order.id}`);
}

export async function updateOrderStatus(
  id: string,
  status: string
): Promise<OrderActionState> {
  const parsed = orderStatusSchema.safeParse({ id, status });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: `Failed to update status: ${error.message}` };
  }

  revalidatePath(`/orders/${id}`);
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function updateOrderDelivery(
  id: string,
  deliveryDate: string
): Promise<OrderActionState> {
  const parsed = z
    .object({
      id: z.uuid(),
      deliveryDate: z
        .string()
        .transform((value) => (value === "" ? null : value))
        .pipe(z.iso.date("Enter a valid date.").nullable()),
    })
    .safeParse({ id, deliveryDate });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ delivery_date: parsed.data.deliveryDate })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: `Failed to update delivery date: ${error.message}` };
  }

  revalidatePath(`/orders/${id}`);
  revalidatePath("/orders");
  return { error: null };
}

export async function deleteOrder(id: string): Promise<void> {
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) {
    throw new Error("Invalid order id.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .delete()
    .eq("id", parsed.data);

  if (error) {
    throw new Error(`Failed to delete order: ${error.message}`);
  }

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect("/orders");
}
