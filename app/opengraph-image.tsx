import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Sentrix Scan — Block Explorer";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0A0E1A 0%, #1E3A8A 50%, #4C1D95 100%)",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            width: 180,
            height: 180,
            borderRadius: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
            fontSize: 120,
            fontWeight: 800,
            marginBottom: 40,
            boxShadow: "0 20px 60px rgba(59,130,246,0.4)",
          }}
        >
          S
        </div>
        <div style={{ fontSize: 80, fontWeight: 700, letterSpacing: -2, display: "flex", gap: 20 }}>
          <span>Sentrix</span>
          <span style={{ color: "#60A5FA" }}>Scan</span>
        </div>
        <div style={{ fontSize: 28, color: "#94A3B8", marginTop: 16 }}>
          Block Explorer for Sentrix Chain (SRX)
        </div>
        <div style={{ fontSize: 20, color: "#64748B", marginTop: 40, fontFamily: "monospace" }}>
          Chain ID 7119 · Mainnet
        </div>
      </div>
    ),
    { ...size },
  );
}
