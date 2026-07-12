import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { updateQuote } from "@/app/(dashboard)/quotes/actions";
import { QuoteForm } from "@/components/quotes/quote-form";
import { getContacts } from "@/lib/data/contacts";
import { getInquiries } from "@/lib/data/inquiries";
import { getQuoteById } from "@/lib/data/quotes";

export const metadata: Metadata = {
  title: "Edit quote — PULI OS",
};

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [quote, contacts, inquiries] = await Promise.all([
    getQuoteById(id),
    getContacts(),
    getInquiries(),
  ]);

  if (!quote) {
    notFound();
  }

  const updateAction = updateQuote.bind(null, quote.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit {quote.quote_number}
        </h1>
        <p className="text-sm text-muted-foreground">
          Update quote details and items.
        </p>
      </div>
      <QuoteForm
        action={updateAction}
        contacts={contacts.map(({ id, full_name }) => ({ id, full_name }))}
        inquiries={inquiries.map(({ id, subject }) => ({ id, subject }))}
        quote={quote}
        items={quote.quote_items}
      />
    </div>
  );
}
