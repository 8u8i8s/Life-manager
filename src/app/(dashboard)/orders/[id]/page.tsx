import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { deleteOrder } from "@/app/(dashboard)/orders/actions";
import { OrderDeliveryDate } from "@/components/orders/order-delivery-date";
import { OrderStatusSelect } from "@/components/orders/order-status-select";
import { DeleteButton } from "@/components/shared/delete-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getOrderById } from "@/lib/data/orders";
import { formatCurrency, formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Order — PULI OS",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  const deleteAction = deleteOrder.bind(null, order.id);

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
            <Link href="/orders">
              <ArrowLeft className="size-4" />
              Back to orders
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            {order.order_number}
          </h1>
          <p className="text-sm text-muted-foreground">
            Created {formatDateTime(order.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusSelect orderId={order.id} status={order.status} />
          <DeleteButton
            action={deleteAction}
            title="Delete order"
            description="This permanently deletes the order. This action cannot be undone."
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Order details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Total (incl. VAT)</dt>
                <dd className="text-lg font-semibold">
                  {formatCurrency(order.total, order.currency)}
                </dd>
              </div>
              {order.quotes ? (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Source quote</dt>
                  <dd>
                    <Link
                      href={`/quotes/${order.quotes.id}`}
                      className="font-medium hover:underline"
                    >
                      {order.quotes.quote_number}
                    </Link>
                  </dd>
                </div>
              ) : null}
            </dl>

            <Separator />

            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">
                Delivery date
              </span>
              <OrderDeliveryDate
                orderId={order.id}
                deliveryDate={order.delivery_date}
              />
            </div>

            {order.notes ? (
              <>
                <Separator />
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {order.notes}
                </p>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent>
            {order.contacts ? (
              <dl className="flex flex-col gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Contact</dt>
                  <dd className="font-medium">{order.contacts.full_name}</dd>
                </div>
                {order.contacts.email ? (
                  <div>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd>{order.contacts.email}</dd>
                  </div>
                ) : null}
                {order.contacts.phone ? (
                  <div>
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd>{order.contacts.phone}</dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                No contact linked.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
