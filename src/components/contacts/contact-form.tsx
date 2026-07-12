"use client";

import { useActionState } from "react";

import type { ContactActionState } from "@/app/(dashboard)/contacts/actions";
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
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/types/database";

type ContactFormProps = {
  action: (
    prevState: ContactActionState,
    formData: FormData
  ) => Promise<ContactActionState>;
  contact?: Tables<"contacts">;
};

const initialState: ContactActionState = { error: null };

export function ContactForm({ action, contact }: ContactFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const isEdit = Boolean(contact);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? "Edit contact" : "New contact"}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Update the contact's details."
            : "Add a customer or partner to your company."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={contact?.full_name}
              placeholder="Ján Novák"
              required
              minLength={2}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={contact?.email ?? ""}
                placeholder="jan.novak@firma.sk"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={contact?.phone ?? ""}
                placeholder="+421 900 123 456"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                name="organization"
                defaultValue={contact?.organization ?? ""}
                placeholder="Stavby Plus s.r.o."
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                defaultValue={contact?.address ?? ""}
                placeholder="Hlavná 1, Bratislava"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={4}
              defaultValue={contact?.notes ?? ""}
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
                  : "Create contact"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
