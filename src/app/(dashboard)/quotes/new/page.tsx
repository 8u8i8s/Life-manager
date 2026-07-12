import type { Metadata } from "next";

import { createQuote } from "@/app/(dashboard)/quotes/actions";
import { QuoteForm } from "@/components/quotes/quote-form";
import { getContacts } from "@/lib/data/contacts";
import { getInquiries } from "@/lib/data/inquiries";

export const metadata: Metadata = {
  title: "New quote — PULI OS",
};

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ inquiry?: string; contact?: string }>;
}) {
  const [{ inquiry, contact }, contacts, inquiries] = await Promise.all([
    searchParams,
    getContacts(),
    getInquiries(),
  ]);

  const relatedInquiry = inquiries.find((item) => item.id === inquiry);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New quote</h1>
        <p className="text-sm text-muted-foreground">
          Create a price quote for a customer.
        </p>
      </div>
      <QuoteForm
        action={createQuote}
        contacts={contacts.map(({ id, full_name }) => ({ id, full_name }))}
        inquiries={inquiries.map(({ id, subject }) => ({ id, subject }))}
        defaultInquiryId={relatedInquiry?.id}
        defaultContactId={contact ?? relatedInquiry?.contacts?.id}
      />
    </div>
  );
}
