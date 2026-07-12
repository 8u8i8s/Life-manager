"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { assignInquiry } from "@/app/(dashboard)/inquiries/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TeamMember } from "@/lib/data/team";

type InquiryAssigneeSelectProps = {
  inquiryId: string;
  assignedTo: string | null;
  members: TeamMember[];
};

export function InquiryAssigneeSelect({
  inquiryId,
  assignedTo,
  members,
}: InquiryAssigneeSelectProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    startTransition(async () => {
      const result = await assignInquiry(inquiryId, value);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Assignee updated.");
      }
    });
  }

  return (
    <Select
      defaultValue={assignedTo ?? "none"}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Unassigned" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Unassigned</SelectItem>
        {members.map((member) => (
          <SelectItem key={member.id} value={member.id}>
            {member.full_name || "Unnamed user"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
