import LeafLoader from "@/components/brand/LeafLoader";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LeafLoader size="md" />
    </div>
  );
}
