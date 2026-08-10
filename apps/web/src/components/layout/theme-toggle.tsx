"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const APPLE_EASE = [0.32, 0.72, 0, 1] as const;

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // The server can't know the resolved theme, so the real button is withheld
  // until we're past hydration. Done through useSyncExternalStore rather than
  // setState-in-an-effect: it reports false for both the server render and the
  // hydration pass, then true on the client, without the cascading re-render
  // that React 19 now flags as a lint error.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) {
    return <Button variant="ghost" size="icon" aria-label="Ganti tema" className="opacity-0" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="overflow-hidden"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "sun" : "moon"}
          initial={{ opacity: 0, rotate: -90, scale: 0.4 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.4 }}
          transition={{ duration: 0.25, ease: APPLE_EASE }}
          className="flex"
        >
          {isDark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
