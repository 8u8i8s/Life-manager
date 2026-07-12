import type { Metadata } from "next";

import { InquiryForm } from "@/components/inquiries/inquiry-form";
import { getContacts } from "@/lib/data/contacts";

export const metadata: Metadata = {
  title: "New inquiry — PULI OS",
};

export default async function NewInquiryPage() {
  const contacts = await getContacts();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New inquiry</h1>
        <p className="text-sm text-muted-foreground">
          Manually record a customer inquiry.
        </p>
      </div>
      <InquiryForm
        contacts={contacts.map(({ id, full_name, email }) => ({
          id,
          full_name,
          email,
        }))}
      />
    </div>
  );
}
