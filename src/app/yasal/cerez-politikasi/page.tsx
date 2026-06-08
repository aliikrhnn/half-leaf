import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Çerez Politikası",
  description: "Half Leaf çerez politikası. Sitemizde kullanılan çerezler ve tercihlerinizi nasıl yönetebileceğiniz.",
};

export default function CerezPolitikasiPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-accent mb-2">Yasal</p>
        <h1 className="text-4xl font-bold text-ink mb-2">Çerez Politikası</h1>
        <p className="text-sm text-ink-dim">Son güncelleme: Ocak 2025</p>
      </div>
      <div className="space-y-6 text-ink-muted leading-relaxed text-sm">
        <p>Bu politika, Half Leaf web sitesinde kullanılan çerezler hakkında bilgi vermektedir.</p>
        <section>
          <h2 className="text-base font-semibold text-ink mb-2">Çerez Nedir?</h2>
          <p>Çerezler, tarayıcınız aracılığıyla cihazınıza yerleştirilen küçük metin dosyalarıdır. Oturumunuzu hatırlamak ve tercihlerinizi saklamak için kullanılır.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink mb-2">Kullandığımız Çerezler</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong className="text-ink">Zorunlu Çerezler:</strong> Sepet ve oturum yönetimi için gereklidir.</li>
            <li><strong className="text-ink">Analitik Çerezler:</strong> Ziyaretçi davranışlarını anlamamıza yardımcı olur.</li>
            <li><strong className="text-ink">Tercih Çerezleri:</strong> Dil ve görünüm tercihlerinizi saklar.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink mb-2">Çerezleri Yönetme</h2>
          <p>Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilirsiniz. Ancak bu, sitenin bazı işlevlerini etkileyebilir.</p>
        </section>
      </div>
    </div>
  );
}
