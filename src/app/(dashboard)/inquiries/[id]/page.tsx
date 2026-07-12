import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";

import { deleteInquiry } from "@/app/(dashboard)/inquiries/actions";
import { InquiryAssigneeSelect } from "@/components/inquiries/inquiry-assignee-select";
import { InquiryReplyCard } from "@/components/inquiries/inquiry-reply-card";
import { InquiryStatusSelect } from "@/components/inquiries/inquiry-status-select";
import { DeleteButton } from "@/components/shared/delete-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getInquiryById } from "@/lib/data/inquiries";
import { getTeamMembers } from "@/lib/data/team";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Inquiry — PULI OS",
};

export default async function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [inquiry, members] = await Promise.all([
    getInquiryById(id),
    getTeamMembers(),
  ]);

  if (!inquiry) {
    notFound();
  }

  const deleteAction = deleteInquiry.bind(null, inquiry.id);

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
            <Link href="/inquiries">
              <ArrowLeft className="size-4" />
              Back to inquiries
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            {inquiry.subject}
          </h1>
          <p className="text-sm text-muted-foreground">
            Received {formatDateTime(inquiry.received_at)} · Source:{" "}
            <span className="capitalize">{inquiry.source}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/quotes/new?inquiry=${inquiry.id}`}>
              <FileText className="size-4" />
              Create quote
            </Link>
          </Button>
          <InquiryStatusSelect
            inquiryId={inquiry.id}
            status={inquiry.status}
          />
          <InquiryAssigneeSelect
            inquiryId={inquiry.id}
            assignedTo={inquiry.assigned_to}
            members={members}
          />
          <DeleteButton
            action={deleteAction}
            title="Delete inquiry"
            description="This permanently deletes the inquiry. This action cannot be undone."
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Message</CardTitle>
            </CardHeader>
            <CardContent>
              {inquiry.raw_content ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {inquiry.raw_content}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No message content recorded.
                </p>
              )}
            </CardContent>
          </Card>

          {inquiry.ai_summary || inquiry.extracted_data ? (
            <Card>
              <CardHeader>
                <CardTitle>AI extraction</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {inquiry.ai_summary ? (
                  <p className="text-sm leading-relaxed">
                    {inquiry.ai_summary}
                  </p>
                ) : null}
                {inquiry.extracted_data ? (
                  <div className="overflow-x-auto rounded-md bg-muted p-3">
                    <pre className="text-xs">
                      {JSON.stringify(inquiry.extracted_data, null, 2)}
                    </pre>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <InquiryReplyCard
            inquiryId={inquiry.id}
            initialDraft={inquiry.ai_reply_draft}
          />
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent>
            {inquiry.contacts ? (
              <dl className="flex flex-col gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium">{inquiry.contacts.full_name}</dd>
                </div>
                {inquiry.contacts.email ? (
                  <div>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd>{inquiry.contacts.email}</dd>
                  </div>
                ) : null}
                {inquiry.contacts.phone ? (
                  <div>
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd>{inquiry.contacts.phone}</dd>
                  </div>
                ) : null}
                {inquiry.contacts.organization ? (
                  <div>
                    <dt className="text-muted-foreground">Organization</dt>
                    <dd>{inquiry.contacts.organization}</dd>
                  </div>
                ) : null}
                <Separator />
                <div>
                  <dt className="text-muted-foreground">Assigned to</dt>
                  <dd>{inquiry.assignee?.full_name || "Unassigned"}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                No contact linked to this inquiry.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
