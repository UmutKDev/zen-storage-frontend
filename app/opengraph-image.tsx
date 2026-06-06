import { ImageResponse } from "next/og";
import { ogImageConfig } from "@/lib/seo";

export const alt = ogImageConfig.alt;
export const size = { width: ogImageConfig.size.width, height: ogImageConfig.size.height };
export const contentType = ogImageConfig.contentType;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "black",
          color: "white",
          fontSize: 96,
          fontWeight: 600,
          letterSpacing: "-0.02em",
        }}
      >
        {ogImageConfig.title}
      </div>
    ),
    size,
  );
}
