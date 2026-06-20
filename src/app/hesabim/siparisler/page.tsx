import { redirect } from "next/navigation";

// Siparişler hesabım ana sayfasında listelenir; eski/dış linkler buraya gelirse
// 404 yerine hesabım sayfasına yönlendirilir.
export default function SiparislerPage() {
  redirect("/hesabim");
}
