import type { Metadata } from "next";

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
import { getContacts } from "@/lib/data/contacts";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Contacts — PULI OS",
};

export default async function ContactsPage() {
  const contacts = await getContacts();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
        <p className="text-sm text-muted-foreground">
          Customers and partners of your company.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All contacts</CardTitle>
          <CardDescription>
            {contacts.length} {contacts.length === 1 ? "contact" : "contacts"}{" "}
            in total.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No contacts yet. Contacts are created automatically from
              incoming inquiries or can be added manually.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      {contact.full_name}
                    </TableCell>
                    <TableCell>{contact.email ?? "—"}</TableCell>
                    <TableCell>{contact.phone ?? "—"}</TableCell>
                    <TableCell>{contact.organization ?? "—"}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDateTime(contact.created_at)}
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
