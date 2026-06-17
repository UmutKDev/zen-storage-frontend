import type { Metadata } from "next";
import { ResetScreen } from "@/features/auth";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPage() {
  return <ResetScreen />;
}
