import { ImageResponse } from "next/og";

export const alt = "LevelUP — Play hard. Level up.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: 42,
          color: "#f5f6fb",
          backgroundColor: "#090a12",
          backgroundImage: "radial-gradient(circle at 78% 35%, rgba(167,139,250,.25), transparent 30%), linear-gradient(135deg, #090a12, #111321)",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: 44,
            border: "1px solid rgba(199,255,70,.45)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#c7ff46", fontSize: 25, fontWeight: 800, letterSpacing: 5 }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, background: "#c7ff46", color: "#090a12", letterSpacing: 0 }}>L</span>
            LEVELUP / GAMING DISCOVERY
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 86, lineHeight: 1, fontWeight: 900, letterSpacing: -3 }}>PLAY HARD.</div>
            <div style={{ fontSize: 86, lineHeight: 1, fontWeight: 900, letterSpacing: -3, color: "#c7ff46" }}>LEVEL UP.</div>
            <div style={{ marginTop: 12, fontSize: 25, color: "#aab1c4" }}>Khám phá game · Hướng dẫn · Cộng đồng game thủ</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, color: "#858ca0", letterSpacing: 3 }}>
            <span>GAMING CULTURE / VIETNAM</span>
            <span>LEVELUP / V2.0</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
