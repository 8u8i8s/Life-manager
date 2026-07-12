import type { Metadata } from "next";

import { createContact } from "@/app/(dashboard)/contacts/actions";
import { ContactForm } from "@/components/contacts/contact-form";

export const metadata: Metadata = {
  title: "New contact — PULI OS",
};

export default function NewContactPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New contact</h1>
        <p className="text-sm text-muted-foreground">
          Add a customer or partner.
        </p>
      </div>
      <ContactForm action={createContact} />
    </div>
  );
}
