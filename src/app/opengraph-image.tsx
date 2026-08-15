import { ImageResponse } from "next/og";

// Tüm sayfalar için varsayılan sosyal paylaşım (OG/Twitter) görseli — kod ile üretilir,
// ikili dosya gerektirmez. Ürün sayfaları kendi ürün görselini override eder.
export const alt = "Half Leaf — Premium Nargile Ekipmanları";
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
          background: "linear-gradient(135deg, #0E0F0C 0%, #14160F 55%, #1A1C12 100%)",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 36,
            border: "1px solid rgba(201,160,106,0.28)",
            borderRadius: 24,
            display: "flex",
          }}
        />
        <div
          style={{
            fontSize: 30,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: "#C9A06A",
            marginBottom: 18,
          }}
        >
          Half Leaf
        </div>
        <div
          style={{
            fontSize: 76,
            fontStyle: "normal",
            color: "#ECEAE2",
            textAlign: "center",
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          Premium Nargile Ekipmanları
        </div>
        <div
          style={{
            marginTop: 26,
            fontSize: 26,
            color: "#8A867A",
            fontFamily: "Arial, sans-serif",
          }}
        >
          Seçilmiş koleksiyon · Güvenli alışveriş
        </div>
        <div
          style={{
            marginTop: 40,
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontFamily: "Arial, sans-serif",
          }}
        >
          <div
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              border: "1px solid rgba(201,160,106,0.5)",
              color: "#C9A06A",
              fontSize: 22,
            }}
          >
            18+
          </div>
          <div style={{ color: "#555145", fontSize: 22 }}>halfleafstore.com</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
