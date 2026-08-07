"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient } from "@/lib/api-client";
import type { ChatSessionDetail, ChatSessionSummary } from "@/lib/ai-tutor-types";
import { Button } from "@/components/ui/button";
import { ChatBubble } from "@/components/ai-tutor/chat-bubble";
import { ChatInput } from "@/components/ai-tutor/chat-input";
import { TypingIndicator } from "@/components/ai-tutor/typing-indicator";
import { SuggestedQuestions } from "@/components/ai-tutor/suggested-questions";
import { HistoryMenu } from "@/components/ai-tutor/history-menu";

export default function AiTutorPage() {
  const router = useRouter();
  const { user, status } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [pendingUserText, setPendingUserText] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);

  const sessionsQuery = useQuery({
    queryKey: ["ai-tutor-sessions"],
    queryFn: () => apiClient.get<{ sessions: ChatSessionSummary[] }>("/api/ai-tutor/sessions"),
    enabled: status === "authenticated",
  });

  const currentSessionQuery = useQuery({
    queryKey: ["ai-tutor-session", currentSessionId],
    queryFn: () => apiClient.get<{ session: ChatSessionDetail }>(`/api/ai-tutor/sessions/${currentSessionId}`),
    enabled: !!currentSessionId,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      let sid = currentSessionId;
      if (!sid) {
        const created = await apiClient.post<{ session: ChatSessionDetail }>("/api/ai-tutor/sessions");
        sid = created.session.id;
        setCurrentSessionId(sid);
      }
      await apiClient.post(`/api/ai-tutor/sessions/${sid}/messages`, { content });
      return sid;
    },
    onMutate: (content) => setPendingUserText(content),
    onSuccess: (sid) => {
      queryClient.invalidateQueries({ queryKey: ["ai-tutor-session", sid] });
      queryClient.invalidateQueries({ queryKey: ["ai-tutor-sessions"] });
    },
    onSettled: () => {
      setPendingUserText(null);
      sendingRef.current = false;
    },
  });

  function handleSendMessage(content: string) {
    if (sendingRef.current) return;
    sendingRef.current = true;
    sendMutation.mutate(content);
  }

  const regenerateMutation = useMutation({
    mutationFn: () => apiClient.post(`/api/ai-tutor/sessions/${currentSessionId}/regenerate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-tutor-session", currentSessionId] });
      queryClient.invalidateQueries({ queryKey: ["ai-tutor-sessions"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/ai-tutor/sessions/${id}`),
    onSuccess: (_data, deletedId) => {
      if (deletedId === currentSessionId) setCurrentSessionId(null);
      queryClient.invalidateQueries({ queryKey: ["ai-tutor-sessions"] });
    },
  });

  const messages = currentSessionQuery.data?.session.messages ?? [];
  const isThinking = sendMutation.isPending;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, pendingUserText, isThinking]);

  if (status === "idle" || status === "loading") {
    return <div className="py-24 text-center text-sm text-muted-foreground">Memuat...</div>;
  }
  if (!user) return null;

  const lastMessage = messages[messages.length - 1];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <div className="flex h-[75vh] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h1 className="font-heading text-lg font-bold text-foreground">AI Tutor</h1>
            <p className="text-xs text-muted-foreground">Khusus materi Jaringan Hewan</p>
          </div>
          <div className="flex items-center gap-1.5">
            {currentSessionId && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => deleteMutation.mutate(currentSessionId)}
              >
                <Trash2 className="size-4" /> Hapus
              </Button>
            )}
            <HistoryMenu
              sessions={sessionsQuery.data?.sessions ?? []}
              activeSessionId={currentSessionId}
              onSelect={setCurrentSessionId}
              onNew={() => setCurrentSessionId(null)}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          </div>
        </div>

        {messages.length === 0 && !pendingUserText ? (
          <SuggestedQuestions onPick={handleSendMessage} />
        ) : (
          <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
            {messages.map((m) => (
              <ChatBubble
                key={m.id}
                message={m}
                userName={user.name}
                showRegenerate={m.id === lastMessage?.id && m.role === "ASSISTANT" && !isThinking}
                onRegenerate={() => regenerateMutation.mutate()}
                regenerating={regenerateMutation.isPending}
              />
            ))}

            {pendingUserText && (
              <ChatBubble
                message={{
                  id: "pending",
                  sessionId: currentSessionId ?? "",
                  role: "USER",
                  content: pendingUserText,
                  createdAt: new Date().toISOString(),
                }}
                userName={user.name}
              />
            )}

            {isThinking && <TypingIndicator />}
          </div>
        )}

        <ChatInput onSend={handleSendMessage} disabled={isThinking} />
      </div>
    </div>
  );
}
