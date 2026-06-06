"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { modal } from "@/lib/motion";

/** Step transition wrapper (fade + scale via the shared `modal` variant). */
export function MotionStep({ children }: { children: ReactNode }) {
  return (
    <motion.div variants={modal} initial="hidden" animate="visible" exit="exit">
      {children}
    </motion.div>
  );
}
