import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Enums } from "@/types/database";

type OrderStatus = Enums<"order_status">;

const statusStyles: Record<OrderStatus, string> = {
  confirmed: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  in_production: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  ready: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  delivered: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  cancelled: "bg-red-500/15 text-red-700 dark:text-red-400",
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  confirmed: "Confirmed",
  in_production: "In production",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="secondary" className={cn(statusStyles[status])}>
      {orderStatusLabels[status]}
    </Badge>
  );
}
