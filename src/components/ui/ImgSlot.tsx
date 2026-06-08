import type { CSSProperties } from "react";

interface Props {
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export default function ImgSlot({ label = "görsel", className = "", style }: Props) {
  return (
    <div className={`hl-img-slot ${className}`} style={style}>
      <span>{label}</span>
    </div>
  );
}
