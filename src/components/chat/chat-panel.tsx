"use client";

import { useEffect, useRef, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { SendHorizontal, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const suggestions = [
  "Koľko máme nových dopytov?",
  "Ktoré ponuky čakajú na odpoveď zákazníka?",
  "Aká je celková hodnota objednávok vo výrobe?",
];

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || isPending) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content },
    ];
    setMessages(nextMessages);
    setInput("");
    setIsPending(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: { messages: nextMessages },
      });

      if (error) {
        let message = "AI chat failed. Try again.";
        if (error instanceof FunctionsHttpError) {
          const body = await error.context.json().catch(() => null);
          message = body?.error ?? message;
        }
        toast.error(message);
        setMessages(messages);
        setInput(content);
        return;
      }

      setMessages([
        ...nextMessages,
        { role: "assistant", content: data.reply },
      ]);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="flex h-[calc(100vh-12rem)] flex-col">
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <Sparkles className="size-8 text-muted-foreground" />
              <div>
                <p className="font-medium">Ask about your company data</p>
                <p className="text-sm text-muted-foreground">
                  Inquiries, quotes, orders and contacts — answered from your
                  live data.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => void send(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm",
                  message.role === "user"
                    ? "self-end bg-primary text-primary-foreground"
                    : "self-start bg-muted"
                )}
              >
                {message.content}
              </div>
            ))
          )}
          {isPending ? (
            <div className="self-start rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              Thinking…
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
        >
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(input);
              }
            }}
            placeholder="Ask about inquiries, quotes, orders…"
            rows={2}
            className="flex-1 resize-none"
          />
          <Button type="submit" disabled={isPending || !input.trim()}>
            <SendHorizontal className="size-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
