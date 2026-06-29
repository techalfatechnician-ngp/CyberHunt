import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: "#020306",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#00FF88",
          fontFamily: "monospace",
          fontWeight: "black",
          border: "2px solid #00FF88",
          borderRadius: "6px",
          boxShadow: "0 0 8px rgba(0, 255, 136, 0.5)",
        }}
      >
        C
      </div>
    ),
    {
      ...size,
    }
  );
}
