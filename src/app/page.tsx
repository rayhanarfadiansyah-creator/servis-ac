import Link from "next/link";
import ProdukCatalog from "./ProdukCatalog";

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
    <main className="min-h-screen bg-white text-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <a href="#beranda" className="flex shrink-0 items-center gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-700 text-2xl text-white">
              ❄
            </span>
            <span>
              <span className="block text-lg font-bold text-slate-900">
                Service AC
              </span>
              <span className="block text-xs text-slate-500">
                Layanan panggilan
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
            <a href="#beranda" className="hover:text-blue-700">
              Beranda
            </a>
            <a href="#layanan" className="hover:text-blue-700">
              Layanan
            </a>
            <a href="#harga" className="hover:text-blue-700">
              Daftar Harga
            </a>
            <a href="#produk" className="hover:text-blue-700">
              Produk AC
            </a>
            <a href="#kontak" className="hover:text-blue-700">
              Kontak
            </a>
          </nav>

          {/* Tombol akun dan booking */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/login"
              className="rounded-lg border border-blue-700 px-3 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-blue-100 px-3 py-3 text-sm font-bold text-blue-800 hover:bg-blue-200"
            >
              Daftar
            </Link>

            <Link
              href="/profile"
              className="rounded-lg border border-slate-300 px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Profile
            </Link>

            <Link
              href="/login?next=/booking"
              className="rounded-lg bg-blue-700 px-4 py-3 text-sm font-bold text-white hover:bg-blue-800"
            >
              Booking Servis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="beranda" className="bg-slate-50">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 md:grid-cols-2 md:py-20">
          <div>
            <span className="mb-4 inline-block rounded-md bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-800">
              Layanan Servis Panggilan
            </span>

            <h1 className="max-w-xl text-4xl font-extrabold leading-tight tracking-tight text-slate-950 md:text-5xl">
              Butuh Servis AC di Rumah?
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
              Layanan cuci dan perbaikan AC serta berbagai elektronik rumah
              tangga. Pilih layanan dan tentukan jadwal dengan mudah.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login?next=/booking"
                className="rounded-lg bg-blue-700 px-6 py-4 text-center font-bold text-white hover:bg-blue-800"
              >
                Booking Servis Sekarang →
              </Link>

              <WhatsAppLink className="rounded-lg border-2 border-green-600 bg-white px-6 py-4 text-center font-bold text-green-700 hover:bg-green-50">
                Hubungi WhatsApp
              </WhatsAppLink>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Mudah dipesan · Jadwal jelas · Layanan panggilan
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl bg-blue-100">
            <img
              src="https://images.unsplash.com/photo-1631545806609-7c7b1b2b4b1b?auto=format&fit=crop&w=1000&q=85"
              alt="Unit pendingin ruangan untuk layanan servis AC"
              className="h-72 w-full object-cover md:h-[420px]"
            />
          </div>
        </div>
      </section>

      {/* Services */}
      <section
        id="layanan"
        className="mx-auto max-w-6xl px-5 py-16 md:py-20"
      >
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-950">Layanan Kami</h2>
          <p className="mt-3 text-lg text-slate-600">
            Pilih layanan sesuai kebutuhan rumah Anda.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.name}
              className="rounded-xl border border-slate-200 bg-white p-6"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50 text-3xl">
                {service.icon}
              </div>

              <h3 className="text-xl font-bold text-slate-900">
                {service.name}
              </h3>

              <p className="mt-3 min-h-14 leading-6 text-slate-600">
                {service.description}
              </p>

              <Link
                href="/login?next=/booking"
                className="mt-5 inline-block font-bold text-blue-700 hover:underline"
              >
                Pilih Layanan →
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-slate-950">
              Cara Booking Servis
            </h2>
            <p className="mt-3 text-lg text-slate-600">
              Cukup tiga langkah sederhana.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xl font-bold text-white">
                  {step.number}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 leading-7 text-slate-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/login?next=/booking"
              className="inline-block rounded-lg bg-blue-700 px-7 py-4 font-bold text-white hover:bg-blue-800"
            >
              Mulai Booking
            </Link>
          </div>
        </div>
      </section>

      {/* Price */}
      <section
        id="harga"
        className="mx-auto max-w-6xl px-5 py-16 md:py-20"
      >
        <h2 className="text-3xl font-bold text-slate-950">
          Informasi Harga
        </h2>

        <p className="mt-3 text-lg leading-7 text-slate-600">
          Hubungi kami untuk mengetahui harga layanan sesuai jenis dan kondisi
          unit Anda.
        </p>

        <div className="mt-7 rounded-xl border border-slate-200 p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-xl font-bold">Cuci dan Servis AC</h3>
              <p className="mt-2 text-slate-600">
                Harga dikonfirmasi sebelum pengerjaan.
              </p>
            </div>

            <WhatsAppLink className="inline-block rounded-lg bg-green-600 px-5 py-3 text-center font-bold text-white hover:bg-green-700">
              Tanya Harga
            </WhatsAppLink>
          </div>
        </div>
      </section>

      {/* Products */}
      
{/* Products */}
<section id="produk" className="bg-slate-50 py-16 md:py-20">
  <div className="mx-auto max-w-6xl px-5">
    <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
      <div>
        <h2 className="text-3xl font-bold text-slate-950">
          Pilihan Produk AC
        </h2>
        <p className="mt-3 max-w-xl leading-7 text-slate-600">
          Lihat pilihan AC yang tersedia. Hubungi kami untuk informasi
          lebih lanjut dan pemesanan.
        </p>
      </div>

      <WhatsAppLink className="rounded-lg bg-green-600 px-6 py-4 text-center font-bold text-white hover:bg-green-700">
        Tanya Produk AC
      </WhatsAppLink>
    </div>

    <ProdukCatalog />
  </div>
</section>


      {/* Contact */}
      <section
        id="kontak"
        className="mx-auto max-w-6xl px-5 py-16 md:py-20"
      >
        <div className="rounded-2xl bg-blue-800 px-6 py-10 text-white md:px-12 md:py-14">
          <h2 className="text-3xl font-bold">
            Butuh Bantuan dengan AC Anda?
          </h2>

          <p className="mt-4 max-w-2xl leading-7 text-blue-100">
            Hubungi kami untuk bertanya tentang layanan atau buat booking
            servis sesuai jadwal yang tersedia.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login?next=/booking"
              className="rounded-lg bg-white px-6 py-4 text-center font-bold text-blue-800 hover:bg-blue-50"
            >
              Booking Servis
            </Link>

            <WhatsAppLink className="rounded-lg border border-white px-6 py-4 text-center font-bold text-white hover:bg-blue-700">
              Chat WhatsApp
            </WhatsAppLink>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <p className="font-bold text-slate-900">Service AC</p>
          <p>Servis AC dan berbagai elektronik rumah tangga.</p>
          <p>© {new Date().getFullYear()} Service AC</p>
        </div>
      </footer>

      {/* WhatsApp */}
      <WhatsAppLink className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-green-600 px-5 py-4 font-bold text-white shadow-lg hover:bg-green-700">
        <span className="text-xl">☏</span>
        <span>WhatsApp</span>
      </WhatsAppLink>
    </main>
  );
}
