"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import type { QuoteActionState } from "@/app/(dashboard)/quotes/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import type { Tables } from "@/types/database";

type ContactOption = { id: string; full_name: string };
type InquiryOption = { id: string; subject: string };

type ItemRow = {
  key: number;
  description: string;
  quantity: string;
  unitPrice: string;
};

type QuoteFormProps = {
  action: (
    prevState: QuoteActionState,
    formData: FormData
  ) => Promise<QuoteActionState>;
  contacts: ContactOption[];
  inquiries: InquiryOption[];
  quote?: Tables<"quotes">;
  items?: Tables<"quote_items">[];
  defaultContactId?: string;
  defaultInquiryId?: string;
};

const initialState: QuoteActionState = { error: null };

let nextKey = 1;

function emptyRow(): ItemRow {
  return { key: nextKey++, description: "", quantity: "1", unitPrice: "0" };
}

export function QuoteForm({
  action,
  contacts,
  inquiries,
  quote,
  items,
  defaultContactId,
  defaultInquiryId,
}: QuoteFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [rows, setRows] = useState<ItemRow[]>(() =>
    items && items.length > 0
      ? items.map((item) => ({
          key: nextKey++,
          description: item.description,
          quantity: String(item.quantity),
          unitPrice: String(item.unit_price),
        }))
      : [emptyRow()]
  );
  const [vatRate, setVatRate] = useState(String(quote?.vat_rate ?? 23));

  const isEdit = Boolean(quote);

  const subtotal = useMemo(
    () =>
      rows.reduce(
        (sum, row) =>
          sum + (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0),
        0
      ),
    [rows]
  );
  const vatAmount = subtotal * ((Number(vatRate) || 0) / 100);
  const total = subtotal + vatAmount;

  const itemsJson = JSON.stringify(
    rows.map((row) => ({
      description: row.description,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
    }))
  );

  function updateRow(key: number, patch: Partial<ItemRow>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>{isEdit ? `Edit ${quote?.quote_number}` : "New quote"}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Update quote details and line items."
            : "Create a price quote for a customer."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="items" value={itemsJson} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="contactId">Contact</Label>
              <Select
                name="contactId"
                defaultValue={quote?.contact_id ?? defaultContactId ?? "none"}
              >
                <SelectTrigger id="contactId" className="w-full">
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No contact</SelectItem>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="inquiryId">Related inquiry</Label>
              <Select
                name="inquiryId"
                defaultValue={quote?.inquiry_id ?? defaultInquiryId ?? "none"}
              >
                <SelectTrigger id="inquiryId" className="w-full">
                  <SelectValue placeholder="Select an inquiry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No inquiry</SelectItem>
                  {inquiries.map((inquiry) => (
                    <SelectItem key={inquiry.id} value={inquiry.id}>
                      {inquiry.subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="vatRate">VAT rate (%)</Label>
              <Input
                id="vatRate"
                name="vatRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={vatRate}
                onChange={(event) => setVatRate(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="validUntil">Valid until</Label>
              <Input
                id="validUntil"
                name="validUntil"
                type="date"
                defaultValue={quote?.valid_until ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Items</Label>
            <div className="flex flex-col gap-2">
              {rows.map((row) => (
                <div key={row.key} className="flex flex-wrap items-start gap-2">
                  <Input
                    aria-label="Item description"
                    placeholder="PVC window 1500×1200, white, triple glazing"
                    value={row.description}
                    onChange={(event) =>
                      updateRow(row.key, { description: event.target.value })
                    }
                    className="min-w-40 flex-1"
                    required
                  />
                  <Input
                    aria-label="Quantity"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={row.quantity}
                    onChange={(event) =>
                      updateRow(row.key, { quantity: event.target.value })
                    }
                    className="w-20"
                    required
                  />
                  <Input
                    aria-label="Unit price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.unitPrice}
                    onChange={(event) =>
                      updateRow(row.key, { unitPrice: event.target.value })
                    }
                    className="w-28"
                    required
                  />
                  <div className="flex h-9 w-24 items-center justify-end text-sm text-muted-foreground">
                    {formatCurrency(
                      (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0)
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setRows((current) =>
                        current.length > 1
                          ? current.filter((r) => r.key !== row.key)
                          : current
                      )
                    }
                    disabled={rows.length === 1}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Remove item</span>
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => setRows((current) => [...current, emptyRow()])}
            >
              <Plus className="size-4" />
              Add item
            </Button>
          </div>

          <div className="flex flex-col gap-1 rounded-md bg-muted p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                VAT ({Number(vatRate) || 0}%)
              </span>
              <span>{formatCurrency(vatAmount)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={quote?.notes ?? ""}
              placeholder="Delivery terms, installation, warranty…"
            />
          </div>

          {state.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Create quote"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
