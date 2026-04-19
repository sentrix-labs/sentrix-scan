import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "Top SRX holders on Sentrix Chain — largest accounts ranked by balance, with supply share and activity.",
};

export default function LeaderboardLayout({ children }: { children: ReactNode }) {
  return children;
}
