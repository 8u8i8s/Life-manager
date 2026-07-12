import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import { deleteQuote } from "@/app/(dashboard)/quotes/actions";
import { ConvertQuoteButton } from "@/components/orders/convert-quote-button";
import { QuoteStatusSelect } from "@/components/quotes/quote-status-select";
import { DeleteButton } from "@/components/shared/delete-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getQuoteById, quoteSubtotal } from "@/lib/data/quotes";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Quote — PULI OS",
};

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = await getQuoteById(id);

  if (!quote) {
    notFound();
  }

  const subtotal = quoteSubtotal(quote.quote_items);
  const vatAmount = subtotal * (quote.vat_rate / 100);
  const total = subtotal + vatAmount;
  const deleteAction = deleteQuote.bind(null, quote.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 w-fit text-muted-foreground"
          >
            <Link href="/quotes">
              <ArrowLeft className="size-4" />
              Back to quotes
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            {quote.quote_number}
          </h1>
          <p className="text-sm text-muted-foreground">
            Created {formatDateTime(quote.created_at)}
            {quote.valid_until
              ? ` · Valid until ${formatDate(quote.valid_until)}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {quote.status !== "rejected" && quote.status !== "expired" ? (
            <ConvertQuoteButton quoteId={quote.id} />
          ) : null}
          <QuoteStatusSelect quoteId={quote.id} status={quote.status} />
          <Button asChild variant="outline" size="sm">
            <Link href={`/quotes/${quote.id}/edit`}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </Button>
          <DeleteButton
            action={deleteAction}
            title="Delete quote"
            description="This permanently deletes the quote and its items. This action cannot be undone."
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit price</TableHead>
                  <TableHead className="text-right">Line total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.quote_items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.description}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unit_price, quote.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(
                        item.quantity * item.unit_price,
                        quote.currency
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="ml-auto flex w-full max-w-xs flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal, quote.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  VAT ({quote.vat_rate}%)
                </span>
                <span>{formatCurrency(vatAmount, quote.currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total, quote.currency)}</span>
              </div>
            </div>

            {quote.notes ? (
              <>
                <Separator />
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {quote.notes}
                </p>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-3 text-sm">
              {quote.contacts ? (
                <>
                  <div>
                    <dt className="text-muted-foreground">Contact</dt>
                    <dd className="font-medium">{quote.contacts.full_name}</dd>
                  </div>
                  {quote.contacts.email ? (
                    <div>
                      <dt className="text-muted-foreground">Email</dt>
                      <dd>{quote.contacts.email}</dd>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-muted-foreground">No contact linked.</p>
              )}
              {quote.inquiries ? (
                <>
                  <Separator />
                  <div>
                    <dt className="text-muted-foreground">Related inquiry</dt>
                    <dd>
                      <Link
                        href={`/inquiries/${quote.inquiries.id}`}
                        className="font-medium hover:underline"
                      >
                        {quote.inquiries.subject}
                      </Link>
                    </dd>
                  </div>
                </>
              ) : null}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
