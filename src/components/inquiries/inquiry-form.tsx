"use client";

import { useActionState } from "react";

import {
  createInquiry,
  type InquiryActionState,
} from "@/app/(dashboard)/inquiries/actions";
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
import { Constants } from "@/types/database";

type ContactOption = {
  id: string;
  full_name: string;
  email: string | null;
};

const initialState: InquiryActionState = { error: null };

const sourceLabels: Record<string, string> = {
  email: "Email",
  manual: "Manual",
  web: "Web",
  api: "API",
};

export function InquiryForm({ contacts }: { contacts: ContactOption[] }) {
  const [state, formAction, isPending] = useActionState(
    createInquiry,
    initialState
  );

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>New inquiry</CardTitle>
        <CardDescription>
          Record an incoming customer inquiry.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              name="subject"
              placeholder="Quote request — 12 windows for apartment building"
              required
              minLength={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="contactId">Contact</Label>
              <Select name="contactId" defaultValue="none">
                <SelectTrigger id="contactId" className="w-full">
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No contact</SelectItem>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.full_name}
                      {contact.email ? ` (${contact.email})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="source">Source</Label>
              <Select name="source" defaultValue="manual">
                <SelectTrigger id="source" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.inquiry_source.map((source) => (
                    <SelectItem key={source} value={source}>
                      {sourceLabels[source]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="rawContent">Content</Label>
            <Textarea
              id="rawContent"
              name="rawContent"
              rows={6}
              placeholder="Original message from the customer…"
            />
          </div>

          {state.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create inquiry"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
