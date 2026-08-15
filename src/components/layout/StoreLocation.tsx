import { MapPin, Navigation, Phone } from "lucide-react";
import { buildStoreLocation } from "@/lib/store-location";

interface Props {
  address: string;
  phone?: string;
  mapsUrl?: string | null;
  mapEmbedUrl?: string | null;
  /** "compact" → footer bandı, "full" → iletişim sayfası kartı. */
  variant?: "compact" | "full";
}

/**
 * Mağaza konumu — adres + "Yol tarifi al" + gömülü Google Haritalar.
 * Sunucu bileşeni: harita iframe'i tembel yüklenir, JS paketini büyütmez.
 */
export default function StoreLocation({
  address,
  phone,
  mapsUrl,
  mapEmbedUrl,
  variant = "compact",
}: Props) {
  const loc = buildStoreLocation(address, mapsUrl, mapEmbedUrl);
  if (loc.lines.length === 0) return null;

  const isFull = variant === "full";
  const mapHeight = isFull ? 320 : 172;

  return (
    <div className={`hl-store${isFull ? " hl-store--full" : ""}`}>
      <div className="hl-store-info">
        <p className="hl-store-eyebrow">
          <MapPin size={13} aria-hidden />
          Mağazamız
        </p>

        <address className="hl-store-address">
          {loc.lines.map((line, i) => (
            <span
              key={`${i}-${line}`}
              className={i === 0 ? "hl-store-address-main" : undefined}
            >
              {line}
            </span>
          ))}
        </address>

        <div className="hl-store-actions">
          <a
            href={loc.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hl-store-cta"
          >
            <Navigation size={14} aria-hidden />
            Yol tarifi al
          </a>
          {phone && (
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="hl-store-tel">
              <Phone size={13} aria-hidden />
              {phone}
            </a>
          )}
        </div>
      </div>

      <div className="hl-store-map" style={{ height: mapHeight }}>
        <iframe
          src={loc.embedUrl}
          title={`Half Leaf mağaza konumu: ${loc.singleLine}`}
          width="100%"
          height={mapHeight}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          style={{ border: 0, display: "block" }}
        />
        <a
          href={loc.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hl-store-map-badge"
        >
          <Navigation size={12} aria-hidden />
          Haritada aç
        </a>
      </div>
    </div>
  );
}
