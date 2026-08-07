"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

const APPLE_EASE = [0.32, 0.72, 0, 1] as const;

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10, scale: 0.995 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.995 }}
        transition={{ duration: 0.28, ease: APPLE_EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
