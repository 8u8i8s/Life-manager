import type { Metadata } from "next";
import { ChartColumn, FileText, Inbox, Package } from "lucide-react";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
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
import { getAnalytics } from "@/lib/data/analytics";
import { formatCurrency } from "@/lib/format";

export const metadata: Metadata = {
  title: "Analytics — PULI OS",
};

const monthFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
});

export default async function AnalyticsPage() {
  const analytics = await getAnalytics();
  const maxMonthly = Math.max(
    1,
    ...analytics.inquiriesByMonth.map((row) => row.count)
  );

  const kpis = [
    {
      label: "Inquiries (6 months)",
      value: String(analytics.totals.inquiries),
      icon: Inbox,
    },
    {
      label: "Quote conversion",
      value:
        analytics.totals.conversionRate === null
          ? "—"
          : `${Math.round(analytics.totals.conversionRate * 100)}%`,
      icon: FileText,
    },
    {
      label: "Orders",
      value: String(analytics.totals.orders),
      icon: Package,
    },
    {
      label: "Order value (incl. VAT)",
      value: formatCurrency(analytics.totals.ordersValue),
      icon: ChartColumn,
    },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Pipeline overview: inquiries, quote conversion and order value.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon }) => (
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inquiries per month</CardTitle>
            <CardDescription>Last six months.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="w-1/2">Volume</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.inquiriesByMonth.map((row) => (
                  <TableRow key={row.month}>
                    <TableCell className="font-medium">
                      {monthFormatter.format(new Date(`${row.month}-01`))}
                    </TableCell>
                    <TableCell>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{
                            width: `${(row.count / maxMonthly) * 100}%`,
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quotes by status</CardTitle>
              <CardDescription>
                Values include VAT. {analytics.totals.quotes} quotes in total.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.quotesByStatus.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No quotes yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.quotesByStatus.map((row) => (
                      <TableRow key={row.status}>
                        <TableCell>
                          <QuoteStatusBadge status={row.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {row.count}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Orders by status</CardTitle>
              <CardDescription>
                Values include VAT. {analytics.totals.orders} orders in total.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.ordersByStatus.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No orders yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.ordersByStatus.map((row) => (
                      <TableRow key={row.status}>
                        <TableCell>
                          <OrderStatusBadge status={row.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {row.count}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
