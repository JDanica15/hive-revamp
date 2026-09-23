import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Hive BPO — Where people, talent and technology connect";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default social share image, in the site's colours (foreground navy + accent amber).
export default async function OpenGraphImage() {
  const logo = await readFile(join(process.cwd(), "src/assets/logo-mark.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #0f1729 0%, #1b2742 100%)",
          color: "#f7f4ef",
        }}
      >
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 6, textTransform: "uppercase", color: "#b67a2b" }}>
          Strategic Outsourcing, Human Intelligence
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 76, lineHeight: 1.02, fontFamily: "serif" }}>
          <span>Where people, talent</span>
          <span>and technology connect</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- rendered by ImageResponse, not the browser */}
          <img src={logoSrc} width={72} height={72} alt="" style={{ borderRadius: 12 }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 34, fontWeight: 600 }}>Hive BPO</span>
            <span style={{ fontSize: 22, color: "rgba(247,244,239,0.6)" }}>
              HR · Bookkeeping · Customer Service · Sydney, Australia
            </span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
