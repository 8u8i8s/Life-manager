import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable();

export const contactSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the contact's name."),
  email: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .pipe(z.email("Enter a valid email address.").nullable()),
  phone: optionalText,
  organization: optionalText,
  address: optionalText,
  notes: optionalText,
});

export type ContactInput = z.infer<typeof contactSchema>;
