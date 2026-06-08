import LeafMark from "./LeafMark";

interface Props {
  size?: "sm" | "md";
}

export default function LeafLoader({ size = "md" }: Props) {
  const h = size === "sm" ? 20 : 44;
  const w = Math.round((h * 324) / 650);
  return <LeafMark breathe width={w} height={h} />;
}
