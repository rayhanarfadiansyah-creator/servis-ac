
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type TanggalLibur = {
  id: number;
  tanggal: string;
  keterangan: string;
};

type TanggalPenuh = {
  tanggal: string;
  jumlah_aktif: number;
  kuota: number;
};

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const NAMA_HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function formatTanggal(tanggal: string) {
  if (!tanggal) return "";
  const [tahun, bulan, hari] = tanggal.split("-").map(Number);
  return new Date(tahun, bulan - 1, hari, 12).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function tanggalLokal(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

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

  const [tanggalLibur, setTanggalLibur] = useState<TanggalLibur[]>([]);
  const [tanggalPenuh, setTanggalPenuh] = useState<TanggalPenuh[]>([]);
  const [kuotaHarian, setKuotaHarian] = useState<number | null>(null);
  const [loadingLibur, setLoadingLibur] = useState(true);
  const [errorLibur, setErrorLibur] = useState("");

  const [bulanKalender, setBulanKalender] = useState(() => {
    const sekarang = new Date();
    return new Date(sekarang.getFullYear(), sekarang.getMonth(), 1);
  });

  const muatJadwal = useCallback(async () => {
    setLoadingLibur(true);
    setErrorLibur("");

    try {
      const supabase = createClient();

      const [
        { data: libur, error: errorDataLibur },
        { data: penuh, error: errorDataPenuh },
        { data: pengaturan, error: errorPengaturan },
      ] = await Promise.all([
        supabase
          .from("tanggal_libur")
          .select("id, tanggal, keterangan")
          .order("tanggal", { ascending: true }),
        supabase.rpc("tanggal_booking_penuh"),
        supabase
          .from("pengaturan_booking")
          .select("kuota_harian")
          .eq("id", 1)
          .maybeSingle(),
      ]);

      if (errorDataLibur) throw errorDataLibur;
      if (errorDataPenuh) throw errorDataPenuh;
      if (errorPengaturan) throw errorPengaturan;

      setTanggalLibur(libur ?? []);
      setTanggalPenuh((penuh ?? []) as TanggalPenuh[]);
      setKuotaHarian(pengaturan?.kuota_harian ?? null);
    } catch (error) {
      console.error("Gagal memuat jadwal booking:", error);
      setErrorLibur(
        "Jadwal belum bisa dimuat. Periksa koneksi dan konfigurasi Supabase, lalu coba muat ulang."
      );
    } finally {
      setLoadingLibur(false);
    }
  }, []);

  useEffect(() => {
    void muatJadwal();
  }, [muatJadwal]);

  const hariIni = tanggalLokal(new Date());

  const daftarTanggalLibur = useMemo(
    () => new Map(tanggalLibur.map((item) => [item.tanggal, item])),
    [tanggalLibur]
  );

  const daftarTanggalPenuh = useMemo(
    () => new Map(tanggalPenuh.map((item) => [item.tanggal, item])),
    [tanggalPenuh]
  );

  const tanggalLiburTerpilih = daftarTanggalLibur.get(tanggal);
  const tanggalPenuhTerpilih = daftarTanggalPenuh.get(tanggal);

  const selTanggalKalender = useMemo(() => {
    const tahun = bulanKalender.getFullYear();
    const bulan = bulanKalender.getMonth();
    const hariPertama = new Date(tahun, bulan, 1).getDay();
    const jumlahHari = new Date(tahun, bulan + 1, 0).getDate();

    return [
      ...Array.from({ length: hariPertama }, () => null),
      ...Array.from({ length: jumlahHari }, (_, index) => index + 1),
    ];
  }, [bulanKalender]);

  function pilihTanggal(hari: number) {
    const nilai = tanggalLokal(
      new Date(
        bulanKalender.getFullYear(),
        bulanKalender.getMonth(),
        hari,
        12
      )
    );

    if (
      nilai < tanggalLokal(new Date()) ||
      daftarTanggalLibur.has(nilai) ||
      daftarTanggalPenuh.has(nilai)
    ) {
      return;
    }

    setTanggal(nilai);
  }

  function gantiBulan(arah: number) {
    setBulanKalender((sebelumnya) =>
      new Date(sebelumnya.getFullYear(), sebelumnya.getMonth() + arah, 1)
    );
  }

  function bukaKalenderSekarang() {
    const sekarang = new Date();
    setBulanKalender(
      new Date(sekarang.getFullYear(), sekarang.getMonth(), 1)
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const namaBersih = nama.trim();
    const teleponBersih = telepon.trim();
    const alamatBersih = alamat.trim();
    const jumlah = Number(jumlahUnit);

    if (!namaBersih || !teleponBersih || !alamatBersih || !tanggal) {
      alert("Mohon lengkapi nama, nomor WhatsApp, tanggal, dan alamat.");
      return;
    }

    if (!Number.isInteger(jumlah) || jumlah < 1 || jumlah > 1000) {
      alert("Jumlah unit AC tidak valid.");
      return;
    }

    if (tanggal < tanggalLokal(new Date())) {
      alert("Tanggal booking tidak boleh di masa lalu.");
      return;
    }

    if (daftarTanggalLibur.has(tanggal)) {
      setTanggal("");
      alert("Tanggal tersebut merupakan hari libur servis. Pilih tanggal lain.");
      return;
    }

    if (daftarTanggalPenuh.has(tanggal)) {
      setTanggal("");
      alert("Kuota booking untuk tanggal tersebut sudah penuh. Silakan pilih tanggal lain.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Periksa ulang jadwal langsung sebelum menyimpan booking.
      const [
        { data: liburTerbaru, error: errorLiburTerbaru },
        { data: penuhTerbaru, error: errorPenuhTerbaru },
      ] = await Promise.all([
        supabase.from("tanggal_libur").select("tanggal, keterangan"),
        supabase.rpc("tanggal_booking_penuh"),
      ]);

      if (errorLiburTerbaru || errorPenuhTerbaru) {
        console.error(errorLiburTerbaru || errorPenuhTerbaru);
        alert("Jadwal belum bisa diverifikasi. Coba lagi.");
        return;
      }

      const liburDitemukan = (liburTerbaru ?? []).find(
        (item) => item.tanggal === tanggal
      );

      if (liburDitemukan) {
        setTanggal("");
        await muatJadwal();
        alert(
          `Tanggal tersebut merupakan hari libur servis${
            liburDitemukan.keterangan ? `: ${liburDitemukan.keterangan}` : ""
          }. Silakan pilih tanggal lain.`
        );
        return;
      }

      const tanggalSudahPenuh = ((penuhTerbaru ?? []) as TanggalPenuh[]).some(
        (item) => item.tanggal === tanggal
      );

      if (tanggalSudahPenuh) {
        setTanggal("");
        await muatJadwal();
        alert("Kuota booking untuk tanggal tersebut sudah penuh. Silakan pilih tanggal lain.");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("Lu harus login dulu sebelum booking.");
        router.push("/login?next=/booking");
        return;
      }

      const { error: bookingError } = await supabase.from("bookings").insert({
        user_id: user.id,
        nama: namaBersih,
        telepon: teleponBersih,
        layanan,
        tanggal,
        jumlah_unit: jumlah,
        alamat: alamatBersih,
        keluhan: keluhan.trim() || null,
        status: "Menunggu",
      });

      if (bookingError) {
        console.error("Gagal menyimpan booking:", bookingError);
        const pesanError = bookingError.message.toLowerCase();

        if (
          pesanError.includes("kuota_booking_penuh") ||
          pesanError.includes("kuota booking")
        ) {
          setTanggal("");
          await muatJadwal();
          alert("Maaf, kuota booking tanggal tersebut baru saja penuh. Silakan pilih tanggal lain.");
          return;
        }

        if (
          pesanError.includes("hari libur") ||
          pesanError.includes("libur servis")
        ) {
          setTanggal("");
          await muatJadwal();
          alert("Tanggal tersebut merupakan hari libur servis. Silakan pilih tanggal lain.");
          return;
        }

        alert("Booking gagal disimpan. Periksa konfigurasi tabel dan policy Supabase, lalu coba lagi.");
        return;
      }

      const pesan = [
        "Halo, saya ingin booking servis.",
        "",
        `Nama: ${namaBersih}`,
        `No. WhatsApp: ${teleponBersih}`,
        `Email akun: ${user.email || "-"}`,
        `Layanan: ${layanan}`,
        `Tanggal pilihan: ${tanggal}`,
        `Jumlah unit AC: ${jumlah}`,
        `Alamat: ${alamatBersih}`,
        `Keluhan: ${keluhan.trim() || "Belum diisi"}`,
        "",
        "Booking sudah diajukan melalui website.",
        "Mohon konfirmasi ketersediaan jadwal. Terima kasih.",
      ].join("\n");

      const nomorWhatsApp = "6285945964557";
      const whatsappUrl = `https://wa.me/${nomorWhatsApp}?text=${encodeURIComponent(pesan)}`;

      alert("Booking berhasil disimpan ke website!");
      window.location.assign(whatsappUrl);
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
        <a href="/" className="mb-6 inline-block font-semibold text-blue-700 hover:underline">
          ← Kembali ke Beranda
        </a>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold text-slate-950">Booking Servis</h1>
          <p className="mt-3 leading-7 text-slate-600">
            Isi data berikut untuk mengajukan jadwal servis. Jadwal belum dikonfirmasi sampai tim kami menghubungi Anda.
          </p>

          <section aria-live="polite" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="font-bold text-amber-950">📅 Informasi Hari Libur Servis</h2>
            {loadingLibur ? (
              <p className="mt-2 text-sm text-amber-900">Memuat jadwal...</p>
            ) : errorLibur ? (
              <div className="mt-2">
                <p className="text-sm text-red-700">{errorLibur}</p>
                <button type="button" onClick={() => void muatJadwal()} className="mt-2 text-sm font-semibold text-blue-700 underline">
                  Coba muat ulang
                </button>
              </div>
            ) : tanggalLibur.length === 0 ? (
              <p className="mt-2 text-sm text-amber-900">Belum ada tanggal libur yang diumumkan.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {tanggalLibur.map((item) => (
                  <li key={item.id} className="flex flex-col gap-1 border-t border-amber-200 pt-2 text-sm sm:flex-row sm:justify-between">
                    <span className="font-semibold text-amber-950">{formatTanggal(item.tanggal)}</span>
                    <span className="text-amber-900">{item.keterangan || "Libur servis"}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="nama" className="mb-2 block font-semibold">Nama lengkap</label>
              <input id="nama" required maxLength={120} value={nama} onChange={(e) => setNama(e.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" placeholder="Masukkan nama Anda" />
            </div>

            <div>
              <label htmlFor="telepon" className="mb-2 block font-semibold">Nomor WhatsApp</label>
              <input id="telepon" type="tel" required maxLength={25} value={telepon} onChange={(e) => setTelepon(e.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" placeholder="Contoh: 081234567890" />
            </div>

            <div>
              <label htmlFor="layanan" className="mb-2 block font-semibold">Pilih layanan</label>
              <select id="layanan" value={layanan} onChange={(e) => setLayanan(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3">
                <option>Cuci AC</option>
                <option>Servis AC</option>
                <option>Servis Elektronik Lainnya</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block font-semibold">Tanggal pilihan</label>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <button type="button" onClick={() => gantiBulan(-1)} disabled={bulanKalender.getFullYear() === new Date().getFullYear() && bulanKalender.getMonth() === new Date().getMonth()} aria-label="Bulan sebelumnya" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30">←</button>
                  <div className="text-center">
                    <h3 className="font-bold text-slate-900">{NAMA_BULAN[bulanKalender.getMonth()]} {bulanKalender.getFullYear()}</h3>
                    <button type="button" onClick={bukaKalenderSekarang} className="text-xs font-medium text-blue-700 hover:underline">Kembali ke bulan ini</button>
                  </div>
                  <button type="button" onClick={() => gantiBulan(1)} aria-label="Bulan berikutnya" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-100">→</button>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {NAMA_HARI.map((hari) => (
                    <div key={hari} className="py-2 text-center text-xs font-bold text-slate-500">{hari}</div>
                  ))}

                  {selTanggalKalender.map((hari, index) => {
                    if (hari === null) return <div key={`kosong-${index}`} />;

                    const nilai = tanggalLokal(new Date(bulanKalender.getFullYear(), bulanKalender.getMonth(), hari, 12));
                    const libur = daftarTanggalLibur.get(nilai);
                    const penuh = daftarTanggalPenuh.get(nilai);
                    const sudahLewat = nilai < hariIni;
                    const terpilih = nilai === tanggal;
                    const hariIniTerpilih = nilai === hariIni;
                    const nonaktif = sudahLewat || Boolean(libur) || Boolean(penuh) || loadingLibur || Boolean(errorLibur);

                    let kelas = "relative flex min-h-11 items-center justify-center rounded-lg border text-sm font-semibold transition-colors ";

                    if (libur || penuh) {
                      kelas += "cursor-not-allowed border-red-200 bg-red-100 text-red-700";
                    } else if (sudahLewat) {
                      kelas += "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-300";
                    } else if (terpilih) {
                      kelas += "border-blue-700 bg-blue-700 text-white shadow-sm";
                    } else {
                      kelas += "border-transparent bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50";
                    }

                    const keterangan = libur
                      ? `${libur.keterangan || "Libur servis"} — tidak tersedia`
                      : penuh
                      ? `Kuota penuh (${penuh.jumlah_aktif}/${penuh.kuota} booking)`
                      : sudahLewat
                      ? "Tanggal sudah lewat"
                      : `Pilih ${formatTanggal(nilai)}`;

                    return (
                      <button key={nilai} type="button" disabled={nonaktif} onClick={() => pilihTanggal(hari)} title={keterangan} aria-label={keterangan} aria-pressed={terpilih} className={`${kelas} ${hariIniTerpilih && !libur && !penuh && !terpilih ? "ring-1 ring-blue-400" : ""}`}>
                        {hari}
                        {(libur || penuh) && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-red-600" />}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-red-200 ring-1 ring-red-300" />Libur / kuota penuh</span>
                  <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-blue-700" />Tanggal dipilih</span>
                  <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-slate-100 ring-1 ring-slate-200" />Tanggal lewat</span>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-700">Tanggal yang dipilih:</p>
                <p className="mt-1 font-bold text-blue-700">{tanggal ? formatTanggal(tanggal) : "Belum dipilih"}</p>
                {tanggalLiburTerpilih && <p className="mt-1 text-sm text-red-700">Libur: {tanggalLiburTerpilih.keterangan || "Libur servis"}</p>}
                {tanggalPenuhTerpilih && <p className="mt-1 text-sm text-red-700">Kuota penuh: {tanggalPenuhTerpilih.jumlah_aktif}/{tanggalPenuhTerpilih.kuota} booking aktif.</p>}
              </div>

              {kuotaHarian !== null && !errorLibur && (
                <p className="mt-2 text-sm text-slate-500">Batas saat ini: maksimal {kuotaHarian} booking aktif per hari.</p>
              )}
              {errorLibur && <p className="mt-2 text-sm text-red-700">Kalender tidak dapat digunakan sampai jadwal berhasil dimuat.</p>}
              <p className="mt-2 text-sm text-slate-500">Tanggal libur dan tanggal dengan kuota penuh tidak tersedia untuk booking. Jadwal tetap perlu dikonfirmasi oleh tim kami.</p>
            </div>

            <div>
              <label htmlFor="jumlahUnit" className="mb-2 block font-semibold">Jumlah unit AC</label>
              <select id="jumlahUnit" value={jumlahUnit} onChange={(e) => setJumlahUnit(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3">
                <option value="1">1 unit</option>
                <option value="2">2 unit</option>
                <option value="3">3 unit</option>
                <option value="4">4 unit</option>
                <option value="5">5 unit</option>
                <option value="6">Lebih dari 5 unit (minimal 6)</option>
              </select>
            </div>

            <div>
              <label htmlFor="alamat" className="mb-2 block font-semibold">Alamat lengkap</label>
              <textarea id="alamat" required maxLength={2000} rows={3} value={alamat} onChange={(e) => setAlamat(e.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-3" placeholder="Alamat lokasi servis" />
            </div>

            <div>
              <label htmlFor="keluhan" className="mb-2 block font-semibold">Keluhan (opsional)</label>
              <textarea id="keluhan" maxLength={2000} rows={3} value={keluhan} onChange={(e) => setKeluhan(e.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-3" placeholder="Contoh: AC kurang dingin atau bocor" />
            </div>

            <button type="submit" disabled={loading || loadingLibur || Boolean(errorLibur) || !tanggal} className="w-full rounded-lg bg-blue-700 px-5 py-4 font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Menyimpan Booking..." : loadingLibur ? "Memuat Jadwal..." : "Ajukan Booking via WhatsApp"}
            </button>

            <p className="text-sm leading-6 text-slate-500">
              Data booking disimpan ke database sebelum WhatsApp dibuka. Tim kami tetap perlu mengonfirmasi tanggal yang dipilih.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
