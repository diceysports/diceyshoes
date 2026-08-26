import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B0C0E",
          borderRadius: 14,
        }}
      >
        <div
          style={{
            fontFamily: "sans-serif",
            fontWeight: 800,
            fontSize: 30,
            color: "#FAFAF8",
            transform: "skewX(-8deg)",
            letterSpacing: -1,
          }}
        >
          DS
        </div>
      </div>
    ),
    { ...size }
  );
}
