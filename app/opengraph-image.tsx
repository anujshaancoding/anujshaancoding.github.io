import { ImageResponse } from "next/og";

// One branded 1200x630 social-share card, applied site-wide (home, /blog and
// every post) so shared links render a proper preview. Uses the `edge`
// runtime — the Node build of next/og fails to prerender on Windows.
export const runtime = "edge";
export const alt = "Anuj Kumar — Data Visualization Engineer";
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
          justifyContent: "space-between",
          background: "#070A12",
          backgroundImage:
            "linear-gradient(135deg, rgba(76,141,255,0.22), rgba(154,107,255,0.10) 48%, rgba(7,10,18,0) 72%)",
          padding: "76px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              display: "flex",
              width: "46px",
              height: "6px",
              borderRadius: "999px",
              background: "linear-gradient(90deg,#4C8DFF,#9A6BFF,#3DE0C2)",
            }}
          />
          <div
            style={{
              display: "flex",
              fontSize: "27px",
              letterSpacing: "9px",
              color: "#8A93A6",
              textTransform: "uppercase",
            }}
          >
            Anuj Kumar
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div
            style={{
              display: "flex",
              fontSize: "78px",
              fontWeight: 700,
              color: "#E8EDF7",
              lineHeight: 1.1,
              letterSpacing: "-3px",
            }}
          >
            Data Visualization Engineer
          </div>
          <div style={{ display: "flex", fontSize: "32px", color: "#9AA3B6" }}>
            Power BI Custom Visuals · D3.js · TypeScript
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", fontSize: "27px", color: "#8A93A6" }}>
            Notes & writing on building custom visuals
          </div>
          <div style={{ display: "flex", fontSize: "27px", color: "#3DE0C2" }}>
            anujshaan
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
