"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentUserContext } from "@/lib/data/profile";
import { createClient } from "@/lib/supabase/server";
import { quoteSchema, quoteStatusSchema } from "@/lib/validations/quotes";

export type QuoteActionState = {
  error: string | null;
};

function parseQuoteForm(formData: FormData) {
  const itemsRaw = formData.get("items");
  let items: unknown = [];
  try {
    items = JSON.parse(String(itemsRaw ?? "[]"));
  } catch {
    // leave as empty array — schema will reject it
  }

  return quoteSchema.safeParse({
    contactId: formData.get("contactId") ?? "",
    inquiryId: formData.get("inquiryId") ?? "",
    vatRate: formData.get("vatRate"),
    validUntil: formData.get("validUntil") ?? "",
    notes: formData.get("notes") ?? "",
    items,
  });
}

export async function createQuote(
  _prevState: QuoteActionState,
  formData: FormData
): Promise<QuoteActionState> {
  const parsed = parseQuoteForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const context = await getCurrentUserContext();
  if (!context?.company) {
    return { error: "Your account is not linked to a company." };
  }

  const supabase = await createClient();

  const { data: quoteNumber, error: numberError } = await supabase.rpc(
    "next_quote_number",
    { p_company_id: context.company.id }
  );
  if (numberError) {
    return { error: `Failed to allocate quote number: ${numberError.message}` };
  }

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .insert({
      company_id: context.company.id,
      created_by: context.userId,
      quote_number: quoteNumber,
      contact_id: parsed.data.contactId,
      inquiry_id: parsed.data.inquiryId,
      vat_rate: parsed.data.vatRate,
      valid_until: parsed.data.validUntil,
      notes: parsed.data.notes,
    })
    .select("id")
    .single();

  if (quoteError) {
    return { error: `Failed to create quote: ${quoteError.message}` };
  }

  const { error: itemsError } = await supabase.from("quote_items").insert(
    parsed.data.items.map((item, index) => ({
      quote_id: quote.id,
      company_id: context.company!.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      position: index,
    }))
  );

  if (itemsError) {
    return { error: `Failed to save quote items: ${itemsError.message}` };
  }

  if (parsed.data.inquiryId) {
    await supabase
      .from("inquiries")
      .update({ status: "quoted" })
      .eq("id", parsed.data.inquiryId);
    revalidatePath(`/inquiries/${parsed.data.inquiryId}`);
  }

  revalidatePath("/quotes");
  revalidatePath("/dashboard");
  redirect(`/quotes/${quote.id}`);
}

export async function updateQuote(
  id: string,
  _prevState: QuoteActionState,
  formData: FormData
): Promise<QuoteActionState> {
  const parsed = parseQuoteForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const context = await getCurrentUserContext();
  if (!context?.company) {
    return { error: "Your account is not linked to a company." };
  }

  const supabase = await createClient();

  const { error: quoteError } = await supabase
    .from("quotes")
    .update({
      contact_id: parsed.data.contactId,
      inquiry_id: parsed.data.inquiryId,
      vat_rate: parsed.data.vatRate,
      valid_until: parsed.data.validUntil,
      notes: parsed.data.notes,
    })
    .eq("id", id);

  if (quoteError) {
    return { error: `Failed to update quote: ${quoteError.message}` };
  }

  // Replace items atomically enough for a single-user edit flow.
  const { error: deleteError } = await supabase
    .from("quote_items")
    .delete()
    .eq("quote_id", id);
  if (deleteError) {
    return { error: `Failed to update items: ${deleteError.message}` };
  }

  const { error: itemsError } = await supabase.from("quote_items").insert(
    parsed.data.items.map((item, index) => ({
      quote_id: id,
      company_id: context.company!.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      position: index,
    }))
  );
  if (itemsError) {
    return { error: `Failed to save quote items: ${itemsError.message}` };
  }

  revalidatePath(`/quotes/${id}`);
  revalidatePath("/quotes");
  redirect(`/quotes/${id}`);
}

export async function updateQuoteStatus(
  id: string,
  status: string
): Promise<QuoteActionState> {
  const parsed = quoteStatusSchema.safeParse({ id, status });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("quotes")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: `Failed to update status: ${error.message}` };
  }

  revalidatePath(`/quotes/${id}`);
  revalidatePath("/quotes");
  return { error: null };
}

export async function deleteQuote(id: string): Promise<void> {
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) {
    throw new Error("Invalid quote id.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("quotes").delete().eq("id", parsed.data);

  if (error) {
    throw new Error(`Failed to delete quote: ${error.message}`);
  }

  revalidatePath("/quotes");
  revalidatePath("/dashboard");
  redirect("/quotes");
}
