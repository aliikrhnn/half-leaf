import LeafMark from "./LeafMark";

interface Props {
  width?: number;
  height?: number;
  className?: string;
  /** Show full logo with HALF/LEAF text paths. Default: leaf mark only. */
  full?: boolean;
}

export default function HalfLeafLogo({ width = 20, height = 36, className, full }: Props) {
  return <LeafMark width={width} height={height} className={className} full={full} />;
}
