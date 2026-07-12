"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateOrderDelivery } from "@/app/(dashboard)/orders/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type OrderDeliveryDateProps = {
  orderId: string;
  deliveryDate: string | null;
};

export function OrderDeliveryDate({
  orderId,
  deliveryDate,
}: OrderDeliveryDateProps) {
  const [value, setValue] = useState(deliveryDate ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateOrderDelivery(orderId, value);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Delivery date updated.");
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Input
        type="date"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="w-fit"
      />
      <Button
        variant="outline"
        onClick={handleSave}
        disabled={isPending || value === (deliveryDate ?? "")}
      >
        {isPending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
