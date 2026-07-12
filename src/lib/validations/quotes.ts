import { z } from "zod";

import { Constants } from "@/types/database";

const optionalUuid = z
  .string()
  .transform((value) => (value === "" || value === "none" ? null : value))
  .pipe(z.uuid().nullable());

export const quoteItemSchema = z.object({
  description: z.string().trim().min(1, "Item description is required."),
  quantity: z.coerce.number().positive("Quantity must be positive."),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative."),
});

export const quoteSchema = z.object({
  contactId: optionalUuid,
  inquiryId: optionalUuid,
  vatRate: z.coerce
    .number()
    .min(0, "VAT rate cannot be negative.")
    .max(100, "VAT rate cannot exceed 100%."),
  validUntil: z
    .string()
    .transform((value) => (value === "" ? null : value))
    .pipe(z.iso.date("Enter a valid date.").nullable()),
  notes: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .nullable(),
  items: z.array(quoteItemSchema).min(1, "Add at least one item."),
});

export const quoteStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(Constants.public.Enums.quote_status),
});

export type QuoteInput = z.infer<typeof quoteSchema>;
export type QuoteItemInput = z.infer<typeof quoteItemSchema>;
