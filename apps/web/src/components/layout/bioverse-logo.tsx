"use client";

import { motion, useReducedMotion } from "framer-motion";

const APPLE_EASE = [0.32, 0.72, 0, 1] as const;

/**
 * The brand mark, with a little life to it on hover.
 *
 * Motion is deliberately restrained — the mark sits in the navbar on every
 * page, so anything showy would grate by the tenth visit. It settles in once
 * on mount, then only responds to intent: a small lift and tilt on hover, a
 * press-down on tap. Readers who ask their system for less motion get the
 * static mark.
 */
export function BioVerseLogo({ className = "size-9" }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/images/logo.webp" alt="" className={className} />;
  }

  return (
    <motion.span
      className="inline-flex"
      initial={{ opacity: 0, scale: 0.85, rotate: -8 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.5, ease: APPLE_EASE }}
      whileHover={{ scale: 1.1, rotate: 6 }}
      whileTap={{ scale: 0.94, rotate: 0 }}
    >
      {/* alt is empty: the wordmark beside it already names the brand, so a
          second "BioVerse" would just be read out twice by a screen reader. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/logo.webp" alt="" className={className} />
    </motion.span>
  );
}
