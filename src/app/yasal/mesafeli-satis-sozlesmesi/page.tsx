import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi",
  description:
    "Half Leaf mesafeli satış sözleşmesi. 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında online alışveriş koşulları.",
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

function Section({ no, title, children }: { no: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-ink mb-2">
        Madde {no} — {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export default async function MesafeliSatisSozlesmesiPage() {
  const c = await getContact();
  const email = c?.contactEmail ?? "info@halfleafstore.com";
  const phone = c?.contactPhone ?? "+90 212 000 00 00";
  const address = c?.contactAddress || "Isparta / Türkiye";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-accent mb-2">Yasal</p>
        <h1 className="text-4xl font-bold text-ink mb-2">Mesafeli Satış Sözleşmesi</h1>
        <p className="text-sm text-ink-dim">Son güncelleme: Haziran 2026</p>
      </div>

      <div className="space-y-6 text-ink-muted leading-relaxed text-sm">
        <p>
          İşbu Mesafeli Satış Sözleşmesi (&quot;Sözleşme&quot;), 6502 sayılı Tüketicinin Korunması
          Hakkında Kanun ve 27.11.2014 tarihli Mesafeli Sözleşmeler Yönetmeliği hükümleri uyarınca,
          aşağıda bilgileri yer alan SATICI ile ALICI arasında, ALICI&apos;nın{" "}
          <strong className="text-ink">halfleafstore.com</strong> üzerinden elektronik ortamda
          verdiği sipariş kapsamında akdedilmiştir. ALICI, siparişini onayladığında bu Sözleşme&apos;nin
          ve Ön Bilgilendirme Formu&apos;nun tüm koşullarını okuyup kabul etmiş sayılır.
        </p>

        <Section no="1" title="Taraflar ve Satıcı Bilgileri">
          <p>
            <strong className="text-ink">SATICI:</strong> Half Leaf
            <br />
            <span className="text-ink-dim">
              Ticari Unvan: [şirketin tam ticari unvanı] · MERSIS No: [MERSIS] · Vergi Dairesi/No:
              [vergi dairesi / numarası]
            </span>
            <br />
            Adres: {address}
            <br />
            Telefon: {phone} · E-posta: {email} · Web: halfleafstore.com
          </p>
          <p>
            <strong className="text-ink">ALICI:</strong> Sipariş sırasında ad-soyad, teslimat/fatura
            adresi, telefon ve e-posta bilgilerini beyan eden gerçek/tüzel kişi.
          </p>
        </Section>

        <Section no="2" title="Sözleşmenin Konusu">
          <p>
            İşbu Sözleşme&apos;nin konusu; ALICI&apos;nın SATICI&apos;ya ait internet sitesinden
            elektronik ortamda siparişini verdiği, nitelikleri ve satış fiyatı sipariş ekranında ve
            onay e-postasında belirtilen ürün/ürünlerin satışı ve teslimi ile tarafların hak ve
            yükümlülüklerinin, 6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca
            belirlenmesidir.
          </p>
        </Section>

        <Section no="3" title="Sözleşme Konusu Ürün, Ödeme ve Teslimat Bilgileri">
          <p>
            Ürünlerin türü, miktarı, marka/modeli, satış bedeli (KDV dahil), ödeme şekli, teslimat
            adresi, teslim alacak kişi, fatura bilgileri ve kargo ücreti, ALICI&apos;nın sipariş
            tamamlama ekranında ve sipariş onay e-postasında yer alır. Listelenen fiyatlar güncel
            satış fiyatı olup, kampanya bitimine veya stok tükenmesine kadar geçerlidir.
          </p>
        </Section>

        <Section no="4" title="Genel Hükümler">
          <p>
            4.1. ALICI, internet sitesinde sözleşme konusu ürünün temel niteliklerini, satış fiyatını,
            ödeme şeklini ve teslimata ilişkin bilgileri okuyup bilgi sahibi olduğunu ve elektronik
            ortamda gerekli teyidi verdiğini kabul eder.
          </p>
          <p>
            4.2. Sözleşme konusu ürün, yasal 30 günlük süreyi aşmamak kaydıyla, ALICI&apos;nın belirttiği
            adrese kargo firması aracılığıyla teslim edilir.
          </p>
          <p>
            4.3. Ürün, ALICI&apos;dan başka bir kişiye teslim edilecek ise, teslim alacak kişinin teslimatı
            kabul etmemesinden SATICI sorumlu tutulamaz.
          </p>
          <p>
            4.4. SATICI, sözleşme konusu ürünün sağlam, eksiksiz ve siparişte belirtilen niteliklere
            uygun olarak teslim edilmesinden sorumludur.
          </p>
          <p>
            4.5. Yaş sınırı: SATICI&apos;nın ürünleri yalnızca 18 yaş ve üzeri kişilere yöneliktir.
            ALICI, sipariş vererek 18 yaşından büyük olduğunu beyan ve taahhüt eder.
          </p>
        </Section>

        <Section no="5" title="Ödeme">
          <p>
            Kredi/banka kartı ile yapılan ödemeler, <strong className="text-ink">PayTR</strong> güvenli
            ödeme altyapısı üzerinden 256-bit SSL şifreleme ve 3D Secure doğrulaması ile tahsil edilir.
            ALICI&apos;nın kart bilgileri SATICI tarafından görülmez ve saklanmaz. Ayrıca havale/EFT
            seçeneği sunulur. Ödemenin gerçekleşmemesi veya bankaca iptal edilmesi halinde SATICI&apos;nın
            teslimat yükümlülüğü ortadan kalkar.
          </p>
        </Section>

        <Section no="6" title="Cayma Hakkı">
          <p>
            ALICI, malın kendisine veya gösterdiği adresteki kişiye teslim tarihinden itibaren{" "}
            <strong className="text-ink">14 (on dört) gün</strong> içinde hiçbir gerekçe göstermeksizin
            ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir.
          </p>
          <p>
            6.1. Cayma hakkının kullanıldığına dair bildirim, süre içinde {email} adresine veya{" "}
            <Link href="/hesabim/iade-taleplerim/yeni" className="text-accent underline">
              hesabınızdaki iade talebi
            </Link>{" "}
            ekranından yazılı olarak yapılmalıdır.
          </p>
          <p>
            6.2. Cayma bildiriminin SATICI&apos;ya ulaşmasından itibaren 10 gün içinde ürün geri
            alınır; ALICI, ürünü teslim aldığı tarihten itibaren 10 gün içinde SATICI&apos;ya iade
            etmekle yükümlüdür.
          </p>
          <p>
            6.3. Cayma halinde ürün bedeli ve varsa teslimat masrafları, ürünün SATICI&apos;ya
            ulaşmasını takip eden 14 gün içinde, ödeme yöntemine uygun şekilde (kart ödemelerinde
            PayTR üzerinden aynı karta) ALICI&apos;ya iade edilir.
          </p>
          <p>
            6.4. İade edilecek ürünün kutusu, ambalajı, varsa standart aksesuarları ile eksiksiz ve
            hasarsız olması gerekir.
          </p>
        </Section>

        <Section no="7" title="Cayma Hakkının Kullanılamayacağı Ürünler">
          <p>
            Mesafeli Sözleşmeler Yönetmeliği md. 15 uyarınca; tesliminden sonra ambalaj, bant, mühür
            gibi koruyucu unsurları açılmış olan ve iadesi sağlık/hijyen açısından uygun olmayan
            ürünlerde (ör. ağızlık/sipsi, marpuç gibi kişisel temas eden sarf malzemeleri), ALICI&apos;nın
            istekleri doğrultusunda kişiselleştirilen ürünlerde ve niteliği itibarıyla iade edilemeyecek
            ürünlerde cayma hakkı kullanılamaz.
          </p>
        </Section>

        <Section no="8" title="Ayıplı Mal">
          <p>
            Teslim edilen ürünün ayıplı (kusurlu) çıkması halinde ALICI; ücretsiz onarım, ayıpsız misli
            ile değiştirilme, bedel indirimi veya sözleşmeden dönerek bedel iadesi seçimlik haklarından
            birini kullanabilir. Ayıplı maldan doğan sorumluluk 6502 sayılı Kanun&apos;a tabidir.
          </p>
        </Section>

        <Section no="9" title="Temerrüt Hâlleri ve Hukuki Sonuçları">
          <p>
            ALICI&apos;nın kredi kartı ile yaptığı ödemelerde temerrüde düşmesi halinde, kart sahibi
            banka ile yaptığı sözleşme çerçevesinde faiz ödeyeceğini ve bankaya karşı sorumlu olacağını
            kabul eder. Teslim edilmiş ürünün bedelinin ödenmemesi durumunda SATICI&apos;nın yasal yolları
            kullanma hakkı saklıdır.
          </p>
        </Section>

        <Section no="10" title="Uyuşmazlıkların Çözümü">
          <p>
            İşbu Sözleşme&apos;den doğan uyuşmazlıklarda, Ticaret Bakanlığı&apos;nca her yıl ilan edilen
            parasal sınırlar dâhilinde ALICI&apos;nın mal/hizmeti satın aldığı veya ikametgâhının
            bulunduğu yerdeki <strong className="text-ink">Tüketici Hakem Heyetleri</strong>, bu sınırı
            aşan uyuşmazlıklarda <strong className="text-ink">Tüketici Mahkemeleri</strong> yetkilidir.
          </p>
        </Section>

        <Section no="11" title="Yürürlük">
          <p>
            ALICI&apos;nın siparişi elektronik ortamda onaylamasıyla işbu Sözleşme yürürlüğe girer.
            Sözleşme&apos;nin bir nüshası ALICI&apos;nın sipariş onay e-postasında yer alır ve talep
            halinde SATICI tarafından sağlanır.
          </p>
        </Section>

        <p className="text-xs text-ink-dim border-t border-border-default pt-4 mt-2">
          Bu metin yürürlükteki mevzuata uygun olarak hazırlanmıştır. Köşeli parantez [ ] içindeki
          şirket tescil bilgileri (ticari unvan, MERSIS, vergi dairesi/numarası) faaliyet öncesinde
          tamamlanmalı ve metin bir hukuk danışmanına teyit ettirilmelidir.
        </p>
      </div>
    </div>
  );
}
