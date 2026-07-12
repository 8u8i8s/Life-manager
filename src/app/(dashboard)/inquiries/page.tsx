import type { Metadata } from "next";

import { InquiryStatusBadge } from "@/components/inquiries/inquiry-status-badge";
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
import { getInquiries } from "@/lib/data/inquiries";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Inquiries — PULI OS",
};

export default async function InquiriesPage() {
  const inquiries = await getInquiries();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inquiries</h1>
        <p className="text-sm text-muted-foreground">
          Incoming customer inquiries from all channels.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All inquiries</CardTitle>
          <CardDescription>
            {inquiries.length}{" "}
            {inquiries.length === 1 ? "inquiry" : "inquiries"} in total.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inquiries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No inquiries yet. Connect the n8n email workflow or create one
              manually to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map((inquiry) => (
                  <TableRow key={inquiry.id}>
                    <TableCell className="font-medium">
                      {inquiry.subject}
                    </TableCell>
                    <TableCell>
                      {inquiry.contacts ? (
                        <div className="flex flex-col">
                          <span>{inquiry.contacts.full_name}</span>
                          {inquiry.contacts.email ? (
                            <span className="text-xs text-muted-foreground">
                              {inquiry.contacts.email}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <InquiryStatusBadge status={inquiry.status} />
                    </TableCell>
                    <TableCell className="capitalize">
                      {inquiry.source}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDateTime(inquiry.received_at)}
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
