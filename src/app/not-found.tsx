import Link from "next/link";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-gold mb-4">404</p>
        <h1 className="text-2xl font-semibold text-ink mb-2">Sayfa Bulunamadı</h1>
        <p className="text-ink-muted mb-8">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <Link href="/">
          <Button variant="gold" size="lg">Ana Sayfaya Dön</Button>
        </Link>
      </div>
    </div>
  );
}
