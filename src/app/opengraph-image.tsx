import { ImageResponse } from "next/og";

export const alt = "Soroush Chegini — Software Developer & Writer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
          background: "linear-gradient(135deg, #0a0a10 0%, #06231d 60%, #0a0a10 100%)",
          position: "relative",
        }}
      >
        {/* decorative rings */}
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -140,
            width: 520,
            height: 520,
            borderRadius: 9999,
            border: "2px solid rgba(20,210,184,0.25)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -220,
            left: -160,
            width: 620,
            height: 620,
            borderRadius: 9999,
            border: "2px solid rgba(20,210,184,0.18)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 120,
            width: 14,
            height: 14,
            borderRadius: 9999,
            background: "#14d2b8",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 90,
            right: 180,
            width: 10,
            height: 10,
            borderRadius: 9999,
            background: "#5eead4",
            display: "flex",
          }}
        />

        {/* badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            border: "1px solid rgba(20,210,184,0.45)",
            background: "rgba(20,210,184,0.1)",
            color: "#14d2b8",
            fontSize: 26,
            fontWeight: 700,
            padding: "10px 28px",
            borderRadius: 999,
            marginBottom: 34,
          }}
        >
          imsoroush.ir
        </div>

        {/* name */}
        <div
          style={{
            display: "flex",
            fontSize: 92,
            fontWeight: 900,
            color: "#f4f6fa",
            letterSpacing: "-2px",
          }}
        >
          Soroush Chegini
        </div>

        {/* role */}
        <div
          style={{
            display: "flex",
            fontSize: 34,
            color: "#9aa3b2",
            marginTop: 18,
          }}
        >
          Software Developer · Telegram Bot Builder · Writer
        </div>

        {/* divider */}
        <div
          style={{
            display: "flex",
            width: 180,
            height: 6,
            borderRadius: 3,
            marginTop: 42,
            background: "linear-gradient(90deg, transparent, #14d2b8, transparent)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
