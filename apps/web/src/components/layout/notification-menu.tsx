"use client";

import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const APPLE_EASE = [0.32, 0.72, 0, 1] as const;

export function NotificationMenu() {
  const notifications: { id: string; title: string; message: string }[] = [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifikasi" className="relative">
          <motion.span
            whileTap={{ scale: 0.75, rotate: -15 }}
            transition={{ duration: 0.2, ease: APPLE_EASE }}
            className="flex"
          >
            <Bell className="size-[18px]" />
          </motion.span>
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
