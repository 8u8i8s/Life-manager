import type { Metadata } from "next";

import { ChatPanel } from "@/components/chat/chat-panel";

export const metadata: Metadata = {
  title: "AI Chat — PULI OS",
};

export default function ChatPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Chat</h1>
        <p className="text-sm text-muted-foreground">
          Ask questions about your inquiries, quotes, orders and contacts.
        </p>
      </div>
      <ChatPanel />
    </div>
  );
}
