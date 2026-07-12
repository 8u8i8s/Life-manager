import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, MailPlus, Users } from "lucide-react";

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
import { getDashboardStats, getRecentInquiries } from "@/lib/data/dashboard";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Dashboard — PULI OS",
};

export default async function DashboardPage() {
  const [stats, recentInquiries] = await Promise.all([
    getDashboardStats(),
    getRecentInquiries(),
  ]);

  const statCards = [
    {
      label: "Total inquiries",
      value: stats.totalInquiries,
      icon: Inbox,
    },
    {
      label: "New inquiries",
      value: stats.newInquiries,
      icon: MailPlus,
    },
    {
      label: "Contacts",
      value: stats.totalContacts,
      icon: Users,
    },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your inquiries and contacts.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent inquiries</CardTitle>
          <CardDescription>
            The latest inquiries received by your company.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentInquiries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No inquiries yet. They will appear here once your email
              automation is connected or you add one manually.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInquiries.map((inquiry) => (
                  <TableRow key={inquiry.id}>
                    <TableCell className="font-medium">
                      <Link
                        href="/inquiries"
                        className="hover:underline"
                      >
                        {inquiry.subject}
                      </Link>
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
