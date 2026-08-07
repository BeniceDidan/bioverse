"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationMenu() {
  const notifications: { id: string; title: string; message: string }[] = [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifikasi" className="relative">
          <Bell className="size-[18px]" />
          {notifications.length > 0 && (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-accent" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
        {notifications.length === 0 ? (
          <p className="px-2.5 py-6 text-center text-sm text-muted-foreground">
            Belum ada notifikasi baru.
          </p>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
