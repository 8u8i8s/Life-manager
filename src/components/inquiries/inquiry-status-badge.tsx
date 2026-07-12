import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Enums } from "@/types/database";

type InquiryStatus = Enums<"inquiry_status">;

const statusStyles: Record<InquiryStatus, string> = {
  new: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  processing: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  extracted: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  quoted: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
  replied: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  closed: "bg-muted text-muted-foreground",
};

const statusLabels: Record<InquiryStatus, string> = {
  new: "New",
  processing: "Processing",
  extracted: "Extracted",
  quoted: "Quoted",
  replied: "Replied",
  closed: "Closed",
};

export function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
  return (
    <Badge variant="secondary" className={cn(statusStyles[status])}>
      {statusLabels[status]}
    </Badge>
  );
}
