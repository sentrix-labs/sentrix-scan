import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sentrix Scan",
    short_name: "SentrixScan",
    description:
      "Block explorer for Sentrix Chain (SRX). Browse blocks, transactions, addresses, validators, and SRC-20 tokens.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0E1A",
    theme_color: "#3B82F6",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
