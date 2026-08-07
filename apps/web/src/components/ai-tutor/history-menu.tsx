"use client";

import { History, MessageSquarePlus, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { ChatSessionSummary } from "@/lib/ai-tutor-types";
import { cn } from "@/lib/utils";

export function HistoryMenu({
  sessions,
  activeSessionId,
  onSelect,
  onNew,
  onDelete,
}: {
  sessions: ChatSessionSummary[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Button variant="outline" size="sm" onClick={onNew}>
        <MessageSquarePlus className="size-4" /> Baru
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <History className="size-4" /> Riwayat
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>Riwayat Percakapan</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {sessions.length === 0 && (
            <p className="px-2.5 py-4 text-center text-sm text-muted-foreground">Belum ada percakapan.</p>
          )}
          {sessions.map((s) => (
            <DropdownMenuItem
              key={s.id}
              onSelect={() => onSelect(s.id)}
              className={cn("flex items-center justify-between gap-2", activeSessionId === s.id && "bg-muted")}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{s.title}</p>
                {s.messages[0] && (
                  <p className="truncate text-xs text-muted-foreground">{s.messages[0].content}</p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(s.id);
                }}
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label="Hapus percakapan"
              >
                <Trash2 className="size-3.5" />
              </button>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
