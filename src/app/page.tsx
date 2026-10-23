
import Link from "next/link";
import ProdukCatalog from "./ProdukCatalog";
import AuthNav from "./AuthNav";

const services = [
  {
    name: "Cuci AC",
    description: "Membersihkan AC agar tetap dingin dan nyaman.",
    icon: "❄️",
  },
  {
    name: "Servis AC",
    description: "Pemeriksaan dan perbaikan masalah AC.",
    icon: "🔧",
  },
  {
    name: "Servis Elektronik Lainnya",
    description:
      "Perbaikan berbagai peralatan elektronik rumah tangga. Hubungi kami untuk memastikan jenis perangkat yang dapat diservis.",
    icon: "🔌",
  },
];

const steps = [
  {
    number: "1",
    title: "Pilih layanan",
    description: "Pilih jenis servis yang Anda butuhkan.",
  },
  {
    number: "2",
    title: "Tentukan jadwal",
    description: "Pilih tanggal yang masih tersedia.",
  },
  {
    number: "3",
    title: "Kami bantu servis",
    description: "Tim kami akan menindaklanjuti booking Anda.",
  },
];

const whatsappNumber = "6285945964557";

function WhatsAppLink({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const message = encodeURIComponent(
    "Halo, saya ingin bertanya tentang layanan servis AC."
  );

  return (
    <a
      href={`https://wa.me/${whatsappNumber}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-clip bg-white pb-20 text-slate-800 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5 md:flex-nowrap md:gap-5 md:py-4">
          <a
            href="#beranda"
            className="flex min-w-0 shrink-0 items-center gap-2"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-2xl text-white sm:h-11 sm:w-11">
              ❄
            </span>

            <span className="min-w-0">
              <span className="block text-base font-bold text-slate-900 sm:text-lg">
                BEST Teknik
              </span>
              <span className="block text-xs text-slate-500">
                Layanan panggilan
              </span>
            </span>
          </a>

          <div className="shrink-0">
            <AuthNav />
          </div>

          <nav className="order-3 flex w-full items-center gap-5 overflow-x-auto border-t border-slate-100 pt-3 text-sm font-medium md:order-none md:w-auto md:gap-6 md:overflow-visible md:border-0 md:pt-0">
            <a href="#beranda" className="shrink-0 py-1 hover:text-blue-700">
              Beranda
            </a>
            <a href="#layanan" className="shrink-0 py-1 hover:text-blue-700">
              Layanan
            </a>
            <a href="#harga" className="shrink-0 py-1 hover:text-blue-700">
              Harga
            </a>
            <a href="#produk" className="shrink-0 py-1 hover:text-blue-700">
              Produk AC
            </a>
            <a href="#kontak" className="shrink-0 py-1 hover:text-blue-700">
              Kontak
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section id="beranda" className="scroll-mt-32 bg-slate-50">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-5 sm:py-14 md:grid-cols-2 md:gap-10 md:py-20">
          <div className="min-w-0">
            <span className="mb-4 inline-block rounded-md bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-800 sm:text-sm">
              Layanan Servis Panggilan
            </span>

            <h1 className="max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
              Butuh Servis AC di Rumah?
            </h1>

            <p className="mt-4 max-w-lg text-base leading-7 text-slate-600 sm:mt-5 sm:text-lg sm:leading-8">
              Layanan cuci dan perbaikan AC serta berbagai elektronik rumah
              tangga. Pilih layanan dan tentukan jadwal dengan mudah.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
              <Link
                href="/booking"
                className="flex min-h-12 items-center justify-center rounded-lg bg-blue-700 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-800 sm:px-6 sm:py-4 sm:text-base"
              >
                Booking Servis Sekarang →
              </Link>

              <WhatsAppLink className="flex min-h-12 items-center justify-center rounded-lg border-2 border-green-600 bg-white px-5 py-3 text-center text-sm font-bold text-green-700 transition hover:bg-green-50 sm:px-6 sm:py-4 sm:text-base">
                Hubungi WhatsApp
              </WhatsAppLink>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500 sm:mt-5 sm:text-sm">
              Mudah dipesan · Jadwal jelas · Layanan panggilan
            </p>
          </div>

          <div className="min-w-0 overflow-hidden rounded-2xl bg-blue-100">
            <img
              src="/service-ac-hero.webp"
              alt="Teknisi profesional sedang membersihkan AC"
              width={900}
              height={600}
              fetchPriority="high"
              decoding="async"
              className="h-56 w-full rounded-2xl object-cover sm:h-80 md:h-[420px]"
            />
          </div>
        </div>
      </section>

      {/* Area Layanan Bogor */}
      <section
        aria-labelledby="area-layanan"
        className="mx-auto max-w-6xl px-4 pt-8 sm:px-5 sm:pt-10"
      >
        <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-7">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 sm:text-sm">
                Area Layanan Kami
              </p>
              <h2
                id="area-layanan"
                className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl"
              >
                Servis AC Bogor dan Sekitarnya
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                Melayani jasa servis, cuci, dan perawatan AC panggilan di
                wilayah Bogor, Jawa Barat dan sekitarnya.
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">
                Lokasi di luar area layanan? Silakan hubungi admin untuk
                memastikan jangkauan layanan.
              </p>
            </div>

            <a
  href="https://maps.app.goo.gl/CaLBccRZfg6RQoQr7"
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
>
  <span>📍 Buka Google Maps</span>
  <span aria-hidden="true">↗</span>
</a>
          </div>
        </div>
      </section>

      {/* Services */}
      <section
        id="layanan"
        className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12 sm:px-5 sm:py-16 md:py-20"
      >
        <div className="mb-7 sm:mb-8">
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Layanan Kami
          </h2>
          <p className="mt-2 text-base leading-7 text-slate-600 sm:mt-3 sm:text-lg">
            Pilih layanan sesuai kebutuhan rumah Anda.
          </p>
        </div>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.name}
              className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-3xl sm:h-14 sm:w-14">
                {service.icon}
              </div>

              <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
                {service.name}
              </h3>

              <p className="mt-3 leading-6 text-slate-600">
                {service.description}
              </p>

              <Link
                href="/booking"
                className="mt-5 inline-flex min-h-10 items-center font-bold text-blue-700 hover:underline"
              >
                Pilih Layanan →
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-5">
          <div className="mb-8 text-left sm:mb-10 sm:text-center">
            <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
              Cara Booking Servis
            </h2>
            <p className="mt-2 text-base text-slate-600 sm:mt-3 sm:text-lg">
              Cukup tiga langkah sederhana.
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-700 text-lg font-bold text-white sm:h-12 sm:w-12 sm:text-xl">
                  {step.number}
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
                    {step.title}
                  </h3>
                  <p className="mt-2 leading-7 text-slate-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 sm:mt-10 sm:text-center">
            <Link
              href="/booking"
              className="flex min-h-12 w-full items-center justify-center rounded-lg bg-blue-700 px-7 py-3 font-bold text-white transition hover:bg-blue-800 sm:mx-auto sm:inline-flex sm:w-auto sm:py-4"
            >
              Mulai Booking
            </Link>
          </div>
        </div>
      </section>

      {/* Price */}
      <section
        id="harga"
        className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12 sm:px-5 sm:py-16 md:py-20"
      >
        <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
          Informasi Harga
        </h2>

        <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">
          Hubungi kami untuk mengetahui harga layanan sesuai jenis dan kondisi
          unit Anda.
        </p>

        <div className="mt-6 rounded-xl border border-slate-200 p-5 sm:mt-7 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <h3 className="text-lg font-bold sm:text-xl">
                Cuci dan Servis AC
              </h3>
              <p className="mt-2 leading-6 text-slate-600">
                Harga dikonfirmasi sebelum pengerjaan.
              </p>
            </div>

            <WhatsAppLink className="flex min-h-12 w-full shrink-0 items-center justify-center rounded-lg bg-green-600 px-5 py-3 text-center font-bold text-white transition hover:bg-green-700 sm:w-auto">
              Tanya Harga
            </WhatsAppLink>
          </div>
        </div>
      </section>

      {/* Products */}
      <section
        id="produk"
        className="scroll-mt-24 bg-slate-50 py-12 sm:py-16 md:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-5">
          <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center md:gap-5">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
                Pilihan Produk AC
              </h2>
              <p className="mt-3 max-w-xl leading-7 text-slate-600">
                Lihat pilihan AC yang tersedia. Hubungi kami untuk informasi
                lebih lanjut dan pemesanan.
              </p>
            </div>

            <WhatsAppLink className="flex min-h-12 w-full shrink-0 items-center justify-center rounded-lg bg-green-600 px-6 py-3 text-center font-bold text-white transition hover:bg-green-700 md:w-auto">
              Tanya Produk AC
            </WhatsAppLink>
          </div>

          <div className="mt-6 min-w-0 sm:mt-8">
            <ProdukCatalog />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section
        id="kontak"
        className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12 sm:px-5 sm:py-16 md:py-20"
      >
        <div className="rounded-2xl bg-blue-800 px-5 py-8 text-white sm:px-8 sm:py-10 md:px-12 md:py-14">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Butuh Bantuan dengan AC Anda?
          </h2>

          <p className="mt-4 max-w-2xl leading-7 text-blue-100">
            Hubungi kami untuk bertanya tentang layanan atau buat booking
            servis sesuai jadwal yang tersedia.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row">
            <Link
              href="/booking"
              className="flex min-h-12 items-center justify-center rounded-lg bg-white px-6 py-3 text-center font-bold text-blue-800 transition hover:bg-blue-50 sm:py-4"
            >
              Booking Servis
            </Link>

            <WhatsAppLink className="flex min-h-12 items-center justify-center rounded-lg border border-white px-6 py-3 text-center font-bold text-white transition hover:bg-blue-700 sm:py-4">
              Chat WhatsApp
            </WhatsAppLink>
          </div>
        </div>
      </section>

      
{/* Footer */}
<footer className="border-t border-slate-200 bg-white">
  <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-7 text-sm text-slate-600 sm:px-5 sm:py-8 md:flex-row md:items-center md:justify-between md:gap-3">
    <div>
      <p className="font-bold text-slate-900">BEST Teknik</p>
      <p className="mt-1">
        Servis AC dan berbagai elektronik rumah tangga.
      </p>
    </div>

    <p>© 2026 BEST Teknk. All rights reserved.</p>

    <p className="text-sm">
      Website by{" "}
      <a
        href="https://wa.me/6281385916633?text=Halo%20R%20Studio%20Web%2C%20saya%20tertarik%20membuat%20website."
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-blue-700 transition hover:text-blue-900 hover:underline"
      >
        R Studio Web ↗
      </a>
    </p>
  </div>
</footer>


      {/* Floating WhatsApp */}
      <WhatsAppLink className="fixed bottom-4 right-3 z-50 flex min-h-12 items-center justify-center gap-2 rounded-full bg-green-600 px-4 py-3 font-bold text-white shadow-lg transition hover:bg-green-700 sm:bottom-5 sm:right-5 sm:px-5 sm:py-4">
        <span className="text-xl">☏</span>
        <span className="text-sm sm:text-base">WhatsApp</span>
      </WhatsAppLink>
    </main>
  );
}
