"use client";

import { motion } from "framer-motion";

export function ScrollIndicator() {
  return (
    <div className="mt-14 flex flex-col items-center gap-2 text-xs text-muted-foreground">
      <span>Scroll untuk Jelajahi</span>
      <div className="flex h-8 w-5 items-start justify-center rounded-full border-2 border-muted-foreground/40 p-1">
        <motion.span
          className="size-1.5 rounded-full bg-muted-foreground/60"
          animate={{ y: [0, 10, 0], opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
