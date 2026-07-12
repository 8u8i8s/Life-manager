"use client";

import { useTransition } from "react";
import { PackageCheck } from "lucide-react";
import { toast } from "sonner";

import { createOrderFromQuote } from "@/app/(dashboard)/orders/actions";
import { Button } from "@/components/ui/button";

export function ConvertQuoteButton({ quoteId }: { quoteId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleConvert() {
    startTransition(async () => {
      try {
        const result = await createOrderFromQuote(quoteId);
        if (result?.error) {
          toast.error(result.error);
        }
      } catch (error) {
        // redirect() throws on success — rethrow anything else
        if (
          error instanceof Error &&
          !error.message.includes("NEXT_REDIRECT")
        ) {
          toast.error(error.message);
          return;
        }
        throw error;
      }
    });
  }

  return (
    <Button size="sm" onClick={handleConvert} disabled={isPending}>
      <PackageCheck className="size-4" />
      {isPending ? "Converting…" : "Convert to order"}
    </Button>
  );
}
