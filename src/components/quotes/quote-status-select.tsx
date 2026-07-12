"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { updateQuoteStatus } from "@/app/(dashboard)/quotes/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Constants, type Enums } from "@/types/database";

const statusLabels: Record<Enums<"quote_status">, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
};

type QuoteStatusSelectProps = {
  quoteId: string;
  status: Enums<"quote_status">;
};

export function QuoteStatusSelect({ quoteId, status }: QuoteStatusSelectProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(nextStatus: string) {
    startTransition(async () => {
      const result = await updateQuoteStatus(quoteId, nextStatus);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          `Status changed to ${statusLabels[nextStatus as Enums<"quote_status">]}.`
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
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Constants.public.Enums.quote_status.map((value) => (
          <SelectItem key={value} value={value}>
            {statusLabels[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
