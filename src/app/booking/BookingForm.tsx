
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function BookingPage() {
  const router = useRouter();

  const [layanan, setLayanan] = useState("Cuci AC");
  const [tanggal, setTanggal] = useState("");
  const [jumlahUnit, setJumlahUnit] = useState("1");
  const [alamat, setAlamat] = useState("");
  const [keluhan, setKeluhan] = useState("");
  const [nama, setNama] = useState("");
  const [telepon, setTelepon] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;
    setLoading(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("Lu harus login dulu sebelum booking.");
        router.push("/login?next=/booking");
        return;
      }

      const jumlah = Number(jumlahUnit);

      const { error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          layanan,
          tanggal,
          jumlah_unit: jumlah,
          alamat,
          keluhan: keluhan || null,
          status: "Menunggu",
        });

      if (bookingError) {
        console.error("Gagal menyimpan booking:", bookingError);
        alert(
          "Booking gagal disimpan ke database. Coba lagi, ya. Jika masih gagal, periksa tabel dan kebijakan Supabase."
        );
        return;
      }

      const pesan = [
        "Halo, saya ingin booking servis.",
        "",
        `Nama: ${nama}`,
        `No. WhatsApp: ${telepon}`,
        `Email akun: ${user.email || "-"}`,
        `Layanan: ${layanan}`,
        `Tanggal pilihan: ${tanggal}`,
        `Jumlah unit AC: ${jumlahUnit}`,
        `Alamat: ${alamat}`,
        `Keluhan: ${keluhan || "Belum diisi"}`,
        "",
        "Booking sudah diajukan melalui website.",
        "Mohon konfirmasi ketersediaan jadwal. Terima kasih.",
      ].join("\n");

      // Nomor WhatsApp klien
      const nomorWhatsApp = "6285945964557";

      const whatsappUrl =
        `https://wa.me/${nomorWhatsApp}?text=${encodeURIComponent(pesan)}`;

      alert("Booking berhasil disimpan ke website!");

      // Buka WhatsApp setelah penyimpanan berhasil
      window.location.href = whatsappUrl;
    } catch (error) {
      console.error("Terjadi kesalahan:", error);
      alert("Terjadi kesalahan saat mengajukan booking. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <a
          href="/"
          className="mb-6 inline-block font-semibold text-blue-700 hover:underline"
        >
          ← Kembali ke Beranda
        </a>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold text-slate-950">
            Booking Servis
          </h1>

          <p className="mt-3 leading-7 text-slate-600">
            Isi data berikut untuk mengajukan jadwal servis.
            Jadwal belum dikonfirmasi sampai tim kami menghubungi Anda.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="nama" className="mb-2 block font-semibold">
                Nama lengkap
              </label>
              <input
                id="nama"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                placeholder="Masukkan nama Anda"
              />
            </div>

            <div>
              <label htmlFor="telepon" className="mb-2 block font-semibold">
                Nomor WhatsApp
              </label>
              <input
                id="telepon"
                type="tel"
                required
                value={telepon}
                onChange={(e) => setTelepon(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                placeholder="Contoh: 081234567890"
              />
            </div>

            <div>
              <label htmlFor="layanan" className="mb-2 block font-semibold">
                Pilih layanan
              </label>
              <select
                id="layanan"
                value={layanan}
                onChange={(e) => setLayanan(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
              >
                <option>Cuci AC</option>
                <option>Servis AC</option>
                <option>Servis Elektronik Lainnya</option>
              </select>
            </div>

            <div>
              <label htmlFor="tanggal" className="mb-2 block font-semibold">
                Tanggal pilihan
              </label>
              <input
                id="tanggal"
                type="date"
                required
                min={new Date().toLocaleDateString("en-CA")}
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3"
              />
              <p className="mt-2 text-sm text-slate-500">
                Tanggal ini adalah pilihan Anda, bukan konfirmasi jadwal.
              </p>
            </div>

            <div>
              <label htmlFor="jumlahUnit" className="mb-2 block font-semibold">
                Jumlah unit AC
              </label>
              <select
                id="jumlahUnit"
                value={jumlahUnit}
                onChange={(e) => setJumlahUnit(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
              >
                <option value="1">1 unit</option>
                <option value="2">2 unit</option>
                <option value="3">3 unit</option>
                <option value="4">4 unit</option>
                <option value="5">5 unit</option>
                <option value="6">Lebih dari 5 unit (minimal 6)</option>
              </select>
            </div>

            <div>
              <label htmlFor="alamat" className="mb-2 block font-semibold">
                Alamat lengkap
              </label>
              <textarea
                id="alamat"
                required
                rows={3}
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3"
                placeholder="Alamat lokasi servis"
              />
            </div>

            <div>
              <label htmlFor="keluhan" className="mb-2 block font-semibold">
                Keluhan (opsional)
              </label>
              <textarea
                id="keluhan"
                rows={3}
                value={keluhan}
                onChange={(e) => setKeluhan(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3"
                placeholder="Contoh: AC kurang dingin atau bocor"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-700 px-5 py-4 font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Menyimpan Booking..." : "Ajukan Booking via WhatsApp"}
            </button>

            <p className="text-sm leading-6 text-slate-500">
              Data booking disimpan ke database setelah pengajuan berhasil.
              Tim kami tetap perlu mengonfirmasi ketersediaan tanggal yang dipilih.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
