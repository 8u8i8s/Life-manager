"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { updateInquiryStatus } from "@/app/(dashboard)/inquiries/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Constants, type Enums } from "@/types/database";

const statusLabels: Record<Enums<"inquiry_status">, string> = {
  new: "New",
  processing: "Processing",
  extracted: "Extracted",
  quoted: "Quoted",
  replied: "Replied",
  closed: "Closed",
};

type InquiryStatusSelectProps = {
  inquiryId: string;
  status: Enums<"inquiry_status">;
};

export function InquiryStatusSelect({
  inquiryId,
  status,
}: InquiryStatusSelectProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(nextStatus: string) {
    startTransition(async () => {
      const result = await updateInquiryStatus(inquiryId, nextStatus);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Status changed to ${statusLabels[nextStatus as Enums<"inquiry_status">]}.`);
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
        {Constants.public.Enums.inquiry_status.map((value) => (
          <SelectItem key={value} value={value}>
            {statusLabels[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
