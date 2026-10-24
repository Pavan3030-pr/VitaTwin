import { ImageResponse } from "next/og";

export const alt = "VitaTwin — your living digital health twin";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Link-preview card shown when the site is shared in chats, LinkedIn, X and so on. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 90px",
          background: "linear-gradient(135deg, #EAF6F4 0%, #FAFBFC 60%, #E0F2FE 100%)",
          color: "#0F172A",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <svg width="150" height="150" viewBox="0 0 64 64" fill="none">
            <circle cx="25" cy="32" r="17" fill="#0D9488" fillOpacity="0.22" />
            <circle cx="39" cy="32" r="17" fill="#38BDF8" fillOpacity="0.26" />
            <path d="M4 33h12l4-9 7 22 7-30 5 17h21" stroke="#0F766E" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: 96, fontWeight: 700, marginLeft: 28, letterSpacing: -2 }}>VitaTwin</div>
        </div>
        <div style={{ fontSize: 50, fontWeight: 600, marginTop: 36, color: "#0F766E" }}>
          Your living digital health twin
        </div>
        <div style={{ fontSize: 31, marginTop: 20, color: "#475569", maxWidth: 940, lineHeight: 1.35 }}>
          Explainable early warning for diabetes and heart risk, fused from wearables and health records.
        </div>
        <div style={{ display: "flex", marginTop: 44 }}>
          <div
            style={{
              fontSize: 26,
              padding: "10px 24px",
              borderRadius: 999,
              background: "#0F766E",
              color: "#FFFFFF",
              fontWeight: 600,
            }}
          >
            Synthetic data only · Digital Twin Challenge 2026
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
