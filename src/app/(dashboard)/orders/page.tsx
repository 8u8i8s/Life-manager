import type { Metadata } from "next";
import Link from "next/link";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
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
import { getOrders } from "@/lib/data/orders";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Orders — PULI OS",
};

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">
          Confirmed orders and their production status. Orders are created by
          converting an accepted quote.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All orders</CardTitle>
          <CardDescription>
            {orders.length} {orders.length === 1 ? "order" : "orders"} in
            total.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No orders yet. Convert an accepted quote to create the first
              one.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Delivery</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/orders/${order.id}`}
                        className="hover:underline"
                      >
                        {order.order_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {order.contacts?.full_name ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(order.total, order.currency)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {order.delivery_date
                        ? formatDate(order.delivery_date)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDateTime(order.created_at)}
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
