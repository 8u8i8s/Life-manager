import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getQuotes, quoteSubtotal } from "@/lib/data/quotes";
import { formatCurrency, formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Quotes — PULI OS",
};

export default async function QuotesPage() {
  const quotes = await getQuotes();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quotes</h1>
          <p className="text-sm text-muted-foreground">
            Price quotes for your customers.
          </p>
        </div>
        <Button asChild>
          <Link href="/quotes/new">
            <Plus className="size-4" />
            New quote
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All quotes</CardTitle>
          <CardDescription>
            {quotes.length} {quotes.length === 1 ? "quote" : "quotes"} in
            total.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quotes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No quotes yet. Create one from an inquiry or from scratch.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total (excl. VAT)</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/quotes/${quote.id}`}
                        className="hover:underline"
                      >
                        {quote.quote_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {quote.contacts?.full_name ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <QuoteStatusBadge status={quote.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(
                        quoteSubtotal(quote.quote_items),
                        quote.currency
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDateTime(quote.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
