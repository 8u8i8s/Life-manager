"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUserContext } from "@/lib/data/profile";
import { createClient } from "@/lib/supabase/server";
import { contactSchema } from "@/lib/validations/contacts";

export type ContactActionState = {
  error: string | null;
};

function parseContactForm(formData: FormData) {
  return contactSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    organization: formData.get("organization") ?? "",
    address: formData.get("address") ?? "",
    notes: formData.get("notes") ?? "",
  });
}

export async function createContact(
  _prevState: ContactActionState,
  formData: FormData
): Promise<ContactActionState> {
  const parsed = parseContactForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const context = await getCurrentUserContext();
  if (!context?.company) {
    return { error: "Your account is not linked to a company." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contacts").insert({
    company_id: context.company.id,
    created_by: context.userId,
    full_name: parsed.data.fullName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    organization: parsed.data.organization,
    address: parsed.data.address,
    notes: parsed.data.notes,
  });

  if (error) {
    return { error: `Failed to create contact: ${error.message}` };
  }

  revalidatePath("/contacts");
  revalidatePath("/dashboard");
  redirect("/contacts");
}

export async function updateContact(
  id: string,
  _prevState: ContactActionState,
  formData: FormData
): Promise<ContactActionState> {
  const parsed = parseContactForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("contacts")
    .update({
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      organization: parsed.data.organization,
      address: parsed.data.address,
      notes: parsed.data.notes,
    })
    .eq("id", id);

  if (error) {
    return { error: `Failed to update contact: ${error.message}` };
  }

  revalidatePath("/contacts");
  redirect("/contacts");
}

export async function deleteContact(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("contacts").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete contact: ${error.message}`);
  }

  revalidatePath("/contacts");
  revalidatePath("/dashboard");
  redirect("/contacts");
}
