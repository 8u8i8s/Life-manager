"use client";

import { useState, useTransition } from "react";
import { Copy, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  generateReplyDraft,
  updateReplyDraft,
} from "@/app/(dashboard)/inquiries/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type InquiryReplyCardProps = {
  inquiryId: string;
  initialDraft: string | null;
};

export function InquiryReplyCard({
  inquiryId,
  initialDraft,
}: InquiryReplyCardProps) {
  const [draft, setDraft] = useState(initialDraft ?? "");
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();

  function handleGenerate() {
    startGenerating(async () => {
      const result = await generateReplyDraft(inquiryId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.draft) {
        setDraft(result.draft);
        toast.success("Reply draft generated.");
      }
    });
  }

  function handleSave() {
    startSaving(async () => {
      const result = await updateReplyDraft(inquiryId, draft);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Draft saved.");
      }
    });
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(draft);
    toast.success("Draft copied to clipboard.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI reply</CardTitle>
        <CardDescription>
          Generate a reply draft for the customer, edit it and copy it into
          your email client.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={10}
          placeholder="No draft yet. Click “Generate draft” to let AI write one."
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleGenerate} disabled={isGenerating}>
            <Sparkles className="size-4" />
            {isGenerating ? "Generating…" : "Generate draft"}
          </Button>
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving || draft === (initialDraft ?? "")}
          >
            <Save className="size-4" />
            {isSaving ? "Saving…" : "Save draft"}
          </Button>
          <Button variant="outline" onClick={handleCopy} disabled={!draft}>
            <Copy className="size-4" />
            Copy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
