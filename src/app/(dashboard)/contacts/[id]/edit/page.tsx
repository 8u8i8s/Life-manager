import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  deleteContact,
  updateContact,
} from "@/app/(dashboard)/contacts/actions";
import { ContactForm } from "@/components/contacts/contact-form";
import { DeleteButton } from "@/components/shared/delete-button";
import { getContactById } from "@/lib/data/contacts";

export const metadata: Metadata = {
  title: "Edit contact — PULI OS",
};

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await getContactById(id);

  if (!contact) {
    notFound();
  }

  const updateAction = updateContact.bind(null, contact.id);
  const deleteAction = deleteContact.bind(null, contact.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {contact.full_name}
          </h1>
          <p className="text-sm text-muted-foreground">Edit contact details.</p>
        </div>
        <DeleteButton
          action={deleteAction}
          title="Delete contact"
          description="This permanently deletes the contact. Inquiries linked to it will keep existing without a contact."
        />
      </div>
      <ContactForm action={updateAction} contact={contact} />
    </div>
  );
}
