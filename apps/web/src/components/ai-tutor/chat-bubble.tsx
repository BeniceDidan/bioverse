"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Check, Copy, RotateCcw } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatMarkdown } from "./chat-markdown";
import type { ChatMessage } from "@/lib/ai-tutor-types";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function ChatBubble({
  message,
  userName,
  showRegenerate,
  onRegenerate,
  regenerating,
}: {
  message: ChatMessage;
  userName: string;
  showRegenerate?: boolean;
  onRegenerate?: () => void;
  regenerating?: boolean;
}) {
  const isUser = message.role === "USER";
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — no-op
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("group flex gap-3", isUser && "flex-row-reverse")}
    >
      <Avatar className="mt-0.5 size-8 shrink-0">
        {isUser ? (
          <AvatarFallback className="bg-secondary text-secondary-foreground">{initials(userName)}</AvatarFallback>
        ) : (
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="size-4" />
          </AvatarFallback>
        )}
      </Avatar>

      <div className={cn("flex max-w-[80%] flex-col gap-1", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
            isUser
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : "rounded-tl-sm bg-muted text-foreground"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ChatMarkdown content={message.content} />
          )}
        </div>

        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          <span>{formatTime(message.createdAt)}</span>
          {!isUser && (
            <>
              <button onClick={handleCopy} className="flex items-center gap-1 hover:text-foreground" aria-label="Salin respons">
                {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                {copied ? "Tersalin" : "Salin"}
              </button>
              {showRegenerate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto gap-1 px-1 py-0 text-xs text-muted-foreground hover:text-foreground"
                  onClick={onRegenerate}
                  loading={regenerating}
                >
                  <RotateCcw className="size-3" /> Ulangi
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
