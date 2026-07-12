"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { updateOrderStatus } from "@/app/(dashboard)/orders/actions";
import { orderStatusLabels } from "@/components/orders/order-status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Constants, type Enums } from "@/types/database";

type OrderStatusSelectProps = {
  orderId: string;
  status: Enums<"order_status">;
};

export function OrderStatusSelect({ orderId, status }: OrderStatusSelectProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(nextStatus: string) {
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, nextStatus);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          `Status changed to ${orderStatusLabels[nextStatus as Enums<"order_status">]}.`
        );
      }
    });
  }

  return (
    <Select
      defaultValue={status}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Constants.public.Enums.order_status.map((value) => (
          <SelectItem key={value} value={value}>
            {orderStatusLabels[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
