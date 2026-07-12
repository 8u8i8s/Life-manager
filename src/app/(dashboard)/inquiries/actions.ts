"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { z } from "zod";

import { getCurrentUserContext } from "@/lib/data/profile";
import { createClient } from "@/lib/supabase/server";
import {
  inquiryAssignSchema,
  inquirySchema,
  inquiryStatusSchema,
} from "@/lib/validations/inquiries";

export type InquiryActionState = {
  error: string | null;
};

export async function createInquiry(
  _prevState: InquiryActionState,
  formData: FormData
): Promise<InquiryActionState> {
  const parsed = inquirySchema.safeParse({
    subject: formData.get("subject"),
    contactId: formData.get("contactId") ?? "",
    source: formData.get("source"),
    rawContent: formData.get("rawContent") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const context = await getCurrentUserContext();
  if (!context?.company) {
    return { error: "Your account is not linked to a company." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiries")
    .insert({
      company_id: context.company.id,
      subject: parsed.data.subject,
      contact_id: parsed.data.contactId,
      source: parsed.data.source,
      raw_content: parsed.data.rawContent,
    })
    .select("id")
    .single();

  if (error) {
    return { error: `Failed to create inquiry: ${error.message}` };
  }

  revalidatePath("/inquiries");
  revalidatePath("/dashboard");
  redirect(`/inquiries/${data.id}`);
}

export async function updateInquiryStatus(
  id: string,
  status: string
): Promise<InquiryActionState> {
  const parsed = inquiryStatusSchema.safeParse({ id, status });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("inquiries")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: `Failed to update status: ${error.message}` };
  }

  revalidatePath(`/inquiries/${id}`);
  revalidatePath("/inquiries");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function assignInquiry(
  id: string,
  assignedTo: string
): Promise<InquiryActionState> {
  const parsed = inquiryAssignSchema.safeParse({ id, assignedTo });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("inquiries")
    .update({ assigned_to: parsed.data.assignedTo })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: `Failed to assign inquiry: ${error.message}` };
  }

  revalidatePath(`/inquiries/${id}`);
  revalidatePath("/inquiries");
  return { error: null };
}

export async function generateReplyDraft(
  id: string
): Promise<{ error: string | null; draft?: string }> {
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) {
    return { error: "Invalid inquiry id." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.functions.invoke("generate-reply", {
    body: { inquiry_id: parsed.data },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      return { error: body?.error ?? "Reply generation failed." };
    }
    return { error: "Reply generation failed. Try again." };
  }

  revalidatePath(`/inquiries/${id}`);
  return { error: null, draft: data.draft };
}

export async function updateReplyDraft(
  id: string,
  draft: string
): Promise<{ error: string | null }> {
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) {
    return { error: "Invalid inquiry id." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("inquiries")
    .update({ ai_reply_draft: draft })
    .eq("id", parsed.data);

  if (error) {
    return { error: `Failed to save draft: ${error.message}` };
  }

  revalidatePath(`/inquiries/${id}`);
  return { error: null };
}

export async function deleteInquiry(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("inquiries").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete inquiry: ${error.message}`);
  }

  revalidatePath("/inquiries");
  revalidatePath("/dashboard");
  redirect("/inquiries");
}
