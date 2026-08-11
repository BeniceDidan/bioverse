"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const APPLE_EASE = [0.32, 0.72, 0, 1] as const;

/**
 * The "BioVerse" lettering, cropped from the brand artwork.
 *
 * Two files rather than one: the original lettering is a dark forest green
 * (rgb 53,78,48) that all but disappears on a dark background, so a brightened
 * copy is swapped in under `.dark`. Both are decorative — the surrounding link
 * already carries the accessible name, so alt is empty to avoid a screen reader
 * announcing "BioVerse" twice.
 */
export function BioVerseWordmark({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  // Sized against the 36px emblem beside it — much smaller and the pair stops
  // reading as one lockup, much larger and it crowds the nav on a phone.
  const box = cn("h-5 w-auto sm:h-6", className);

  const images = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/wordmark.webp" alt="" className={cn(box, "dark:hidden")} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/wordmark-dark.webp" alt="" className={cn(box, "hidden dark:block")} />
    </>
  );

  if (reduceMotion) return images;

  return (
    <motion.span
      className="inline-flex"
      // Drifts in just after the mark settles, so the pair reads as one
      // gesture rather than two things appearing at once.
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: APPLE_EASE, delay: 0.12 }}
    >
      {images}
    </motion.span>
  );
}
