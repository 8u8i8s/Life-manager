"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CopyField({ value, label }: { value: string; label: string }) {
  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied to clipboard.`);
  }

  return (
    <div className="flex gap-2">
      <Input readOnly value={value} className="font-mono text-xs" />
      <Button variant="outline" size="icon" onClick={handleCopy}>
        <Copy className="size-4" />
        <span className="sr-only">Copy {label}</span>
      </Button>
    </div>
  );
}
