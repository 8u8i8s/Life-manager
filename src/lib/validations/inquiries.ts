import { z } from "zod";

import { Constants } from "@/types/database";

const optionalUuid = z
  .string()
  .transform((value) => (value === "" || value === "none" ? null : value))
  .pipe(z.uuid().nullable());

export const inquirySchema = z.object({
  subject: z.string().trim().min(3, "Subject must be at least 3 characters."),
  contactId: optionalUuid,
  source: z.enum(Constants.public.Enums.inquiry_source),
  rawContent: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .nullable(),
});

export const inquiryStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(Constants.public.Enums.inquiry_status),
});

export const inquiryAssignSchema = z.object({
  id: z.uuid(),
  assignedTo: optionalUuid,
});

export type InquiryInput = z.infer<typeof inquirySchema>;
