import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Ön Bilgilendirme Formu",
  description:
    "Half Leaf ön bilgilendirme formu. Mesafeli Sözleşmeler Yönetmeliği gereği satın alma öncesi yasal bilgilendirme: satıcı, ürün, fiyat, ödeme, teslimat ve cayma hakkı.",
  robots: { index: true, follow: true },
};

async function getContact() {
  try {
    return await prisma.siteSettings.findUnique({
      where: { id: "site" },
      select: { contactEmail: true, contactPhone: true, contactAddress: true },
    });
  } catch {
    return null;
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-ink mb-2">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export default async function OnBilgilendirmeFormuPage() {
  const c = await getContact();
  const email = c?.contactEmail ?? "info@halfleafstore.com";
  const phone = c?.contactPhone ?? "+90 212 000 00 00";
  const address = c?.contactAddress || "Isparta / Türkiye";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-accent mb-2">Yasal</p>
        <h1 className="text-4xl font-bold text-ink mb-2">Ön Bilgilendirme Formu</h1>
        <p className="text-sm text-ink-dim">Son güncelleme: Haziran 2026</p>
      </div>

      <div className="space-y-6 text-ink-muted leading-relaxed text-sm">
        <p>
          Bu Ön Bilgilendirme Formu, Mesafeli Sözleşmeler Yönetmeliği&apos;nin 5. maddesi uyarınca,
          ALICI&apos;yı sipariş kesinleşmeden önce bilgilendirmek amacıyla hazırlanmıştır. ALICI,
          siparişini onaylamadan önce bu formu ve{" "}
          <Link href="/yasal/mesafeli-satis-sozlesmesi" className="text-accent underline">
            Mesafeli Satış Sözleşmesi
          </Link>
          &apos;ni okuyup kabul ettiğini beyan eder.
        </p>

        <Section title="1. Satıcı Bilgileri">
          <p>
            <strong className="text-ink">Unvan:</strong> Half Leaf — Akdaş Ticaret
            <br />
            <strong className="text-ink">Adres:</strong> {address}
            <br />
            <strong className="text-ink">Telefon:</strong> {phone} · <strong className="text-ink">E-posta:</strong> {email}
            <br />
            <strong className="text-ink">Vergi No:</strong> 0200526472
          </p>
        </Section>

        <Section title="2. Ürünün Temel Nitelikleri ve Fiyatı">
          <p>
            Sipariş konusu ürün/ürünlerin temel nitelikleri (tür, marka, model, içerik), satış fiyatı
            ve adedi, ilgili ürün sayfasında ve sipariş özet ekranında gösterilmektedir. Tüm fiyatlar
            <strong className="text-ink"> KDV dahil</strong> Türk Lirası (₺) cinsindendir. Fiyatlar,
            güncelleme tarihine kadar geçerli olup SATICI tarafından değiştirilebilir; ancak onaylanan
            siparişlerde sipariş anındaki fiyat esas alınır.
          </p>
        </Section>

        <Section title="3. Ödeme Şekli">
          <p>
            Kredi/banka kartı ödemeleri <strong className="text-ink">PayTR</strong> güvenli ödeme
            altyapısı (256-bit SSL, 3D Secure) üzerinden alınır; kart bilgileri SATICI tarafından
            saklanmaz. Havale/EFT seçeneği de sunulur. Taksit imkânı kart tipine göre ödeme ekranında
            belirtilir.
          </p>
        </Section>

        <Section title="4. Teslimat">
          <p>
            Ürün, ALICI&apos;nın bildirdiği adrese anlaşmalı kargo firması ile teslim edilir. Yasal
            teslim süresi siparişin onayından itibaren en geç <strong className="text-ink">30 gündür</strong>;
            uygulamada saat 14:00&apos;ten önceki siparişler aynı gün, sonrası ertesi iş günü kargolanır.
            Kargo ücreti ve ücretsiz kargo eşiği, sipariş özet ekranında gösterilir. Teslimat ve kargo
            koşullarının tamamı için{" "}
            <Link href="/yardim/kargo-teslimat" className="text-accent underline">
              Kargo &amp; Teslimat
            </Link>{" "}
            sayfasına bakınız.
          </p>
        </Section>

        <Section title="5. Cayma Hakkı">
          <p>
            ALICI, ürünü teslim aldığı tarihten itibaren <strong className="text-ink">14 gün</strong>{" "}
            içinde hiçbir gerekçe göstermeksizin ve cezai şart ödemeksizin cayma hakkına sahiptir. Cayma
            bildirimi {email} adresine veya{" "}
            <Link href="/hesabim/iade-taleplerim/yeni" className="text-accent underline">
              iade talebi
            </Link>{" "}
            ekranından yazılı olarak iletilir. Cayma halinde bedel, ürünün iadesini takip eden 14 gün
            içinde aynı ödeme yöntemiyle iade edilir.
          </p>
        </Section>

        <Section title="6. Cayma Hakkının İstisnaları">
          <p>
            Hijyen/sağlık nedeniyle ambalajı açıldığında iadesi uygun olmayan kişisel temaslı sarf
            ürünleri (ör. ağızlık/sipsi, marpuç), kişiye özel üretilen veya niteliği gereği iade
            edilemeyecek ürünlerde cayma hakkı kullanılamaz (Yönetmelik md. 15).
          </p>
        </Section>

        <Section title="7. Şikâyet ve İtiraz Başvuruları">
          <p>
            ALICI, uyuşmazlık hallerinde Ticaret Bakanlığı&apos;nca belirlenen parasal sınırlar
            çerçevesinde yerleşim yerindeki veya alışverişin yapıldığı yerdeki Tüketici Hakem Heyeti
            ya da Tüketici Mahkemesi&apos;ne başvurabilir.
          </p>
        </Section>

        <p className="text-xs text-ink-dim border-t border-border-default pt-4 mt-2">
          Bu form bilgilendirme amaçlıdır ve yürürlüğe girmeden önce bir hukuk danışmanına teyit
          ettirilmesi önerilir.
        </p>
      </div>
    </div>
  );
}
