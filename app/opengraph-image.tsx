import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "mygurm · photobooth for two";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// A simple photo strip: one side pink, one side blue.
export default function OpengraphImage() {
  const rows = [0, 1, 2, 3];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#F8F9FB",
          fontFamily: "sans-serif",
        }}
      >
        {/* Left: the strip */}
        <div
          style={{
            width: 420,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              padding: 20,
              background: "#ffffff",
              borderRadius: 28,
              transform: "rotate(-3deg)",
              boxShadow: "0 24px 60px rgba(20,22,28,0.18)",
            }}
          >
            {rows.map((r) => (
              <div key={r} style={{ display: "flex", gap: 14 }}>
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 18,
                    background: "#FFE6EF",
                    border: "4px solid #FF5C8A",
                  }}
                />
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 18,
                    background: "#E4EDFF",
                    border: "4px solid #3B7DFF",
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right: wordmark + tagline */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingRight: 90,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                background: "#FF5C8A",
                marginRight: -12,
              }}
            />
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                background: "#3B7DFF",
              }}
            />
            <div style={{ fontSize: 40, color: "#6B7280", marginLeft: 10 }}>
              인생네컷
            </div>
          </div>
          <div
            style={{
              fontSize: 104,
              fontWeight: 700,
              color: "#14161C",
              marginTop: 18,
              letterSpacing: -3,
            }}
          >
            mygurm
          </div>
          <div style={{ fontSize: 44, color: "#6B7280", marginTop: 8 }}>
            a photobooth for you and me
          </div>
        </div>
      </div>
    ),
    size
  );
}
