
"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Booking = {
  id: string;
  user_id: string;
  nama: string;
  telepon: string;
  layanan: string;
  tanggal: string;
  jam_servis?: string | null;
  jumlah_unit: number | null;
  alamat: string | null;
  keluhan: string | null;
  status: string;
  created_at: string;
};

type DailyStat = {
  label: string;
  date: string;
  units: number;
};

const STATUSES = [
  "Menunggu",
  "Dikonfirmasi",
  "Diproses",
  "Selesai",
  "Dibatalkan",
];

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const ACTIVE_STATUSES = ["Menunggu", "Dikonfirmasi", "Diproses"];

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date: string) {
  if (!date) return "-";

  return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getMonday(date: Date) {
  const monday = new Date(date);
  const day = monday.getDay();
  monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getLastSevenDays(date: Date) {
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  start.setDate(start.getDate() - 6);

  return {
    start: localDateString(start),
    end: localDateString(today),
  };
}

function isInRange(date: string, start: string, end: string) {
  return date >= start && date <= end;
}

export default function AdminPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const [kuotaHarian, setKuotaHarian] = useState("");
  const [loadingKuota, setLoadingKuota] = useState(true);
  const [savingKuota, setSavingKuota] = useState(false);
  const [errorKuota, setErrorKuota] = useState("");
  const [noticeKuota, setNoticeKuota] = useState("");

  const [jadwalServis, setJadwalServis] = useState({ jam_mulai: "09:00", jam_selesai: "18:00", interval_menit: 60, kapasitas_per_rentang: 2, aktif: true });
  const [loadingJamServis, setLoadingJamServis] = useState(true);
  const [savingJamServis, setSavingJamServis] = useState(false);
  const [errorJamServis, setErrorJamServis] = useState("");
  const [noticeJamServis, setNoticeJamServis] = useState("");

  // Waktu baru dibaca setelah komponen terpasang di browser.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        setError(`Gagal memeriksa login: ${authError.message}`);
        return;
      }

      if (!user) {
        router.replace("/login?next=/admin");
        return;
      }

      const { data: admin, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminError) {
        setError(
          `Gagal memeriksa akses admin: ${adminError.message}`
        );
        return;
      }

      if (!admin) {
        router.replace("/");
        return;
      }

      const { data, error: bookingsError } = await supabase
  .from("bookings")
  .select(
    "id, user_id, nama, telepon, layanan, tanggal, jam_servis, jumlah_unit, alamat, keluhan, status, created_at"
  )
  .order("tanggal", { ascending: true });

      if (bookingsError) {
        setError(`Gagal mengambil booking: ${bookingsError.message}`);
        return;
      }

      setBookings((data ?? []) as Booking[]);
    } catch (err) {
      console.error("loadBookings error:", err);
      setError(
        err instanceof Error
          ? `Gagal memuat booking: ${err.message}`
          : "Terjadi kesalahan saat memuat dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadKuota = useCallback(async () => {
    setLoadingKuota(true);
    setErrorKuota("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        setErrorKuota(`Gagal memeriksa login: ${authError.message}`);
        return;
      }

      if (!user) {
        router.replace("/login?next=/admin");
        return;
      }

      const { data: admin, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminError) {
        setErrorKuota(
          `Gagal memeriksa akses admin: ${adminError.message}`
        );
        return;
      }

      if (!admin) {
        router.replace("/");
        return;
      }

      const { data, error: queryError } = await supabase
        .from("pengaturan_booking")
        .select("kuota_harian")
        .eq("id", 1)
        .maybeSingle();

      if (queryError) {
        setErrorKuota(`Gagal memuat kuota: ${queryError.message}`);
        return;
      }

      if (!data) {
        setErrorKuota(
          "Pengaturan kuota tidak ditemukan. Periksa tabel pengaturan_booking di Supabase."
        );
        return;
      }

      setKuotaHarian(
        data.kuota_harian == null ? "" : String(data.kuota_harian)
      );
    } catch (err) {
      console.error("loadKuota error:", err);
      setErrorKuota(
        err instanceof Error
          ? `Gagal memuat kuota: ${err.message}`
          : "Terjadi kesalahan saat memuat pengaturan kuota."
      );
    } finally {
      setLoadingKuota(false);
    }
  }, [router]);

  const loadJamServis = useCallback(async () => {
    setLoadingJamServis(true);
    setErrorJamServis("");
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setErrorJamServis("Sesi login admin tidak tersedia.");
        return;
      }
      const { data: admin, error: adminError } = await supabase
        .from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
      if (adminError || !admin) {
        setErrorJamServis("Akses admin tidak dapat diverifikasi.");
        return;
      }
      const { data, error } = await supabase.from("pengaturan_jadwal_servis")
        .select("jam_mulai, jam_selesai, interval_menit, kapasitas_per_rentang, aktif")
        .eq("id", 1).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Pengaturan jadwal belum tersedia. Jalankan SQL migrasi jadwal kedatangan terlebih dahulu.");
      setJadwalServis({
        jam_mulai: String(data.jam_mulai).slice(0, 5),
        jam_selesai: String(data.jam_selesai).slice(0, 5),
        interval_menit: Number(data.interval_menit),
        kapasitas_per_rentang: Number(data.kapasitas_per_rentang),
        aktif: Boolean(data.aktif),
      });
    } catch (err) {
      setErrorJamServis(err instanceof Error ? err.message : "Gagal memuat pengaturan jadwal.");
    } finally {
      setLoadingJamServis(false);
    }
  }, []);

  useEffect(() => {
    void loadBookings();
    void loadKuota();
    void loadJamServis();
  }, [loadBookings, loadKuota, loadJamServis]);

  async function simpanKuota(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingKuota(true);
    setErrorKuota("");
    setNoticeKuota("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login?next=/admin");
        return;
      }

      const { data: admin, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminError) {
        setErrorKuota(`Gagal memeriksa admin: ${adminError.message}`);
        return;
      }

      if (!admin) {
        router.replace("/");
        return;
      }

      const input = kuotaHarian.trim();
      const nilaiKuota = input === "" ? null : Number(input);

      if (
        nilaiKuota !== null &&
        (!Number.isSafeInteger(nilaiKuota) || nilaiKuota < 1)
      ) {
        setErrorKuota(
          "Kuota harus bilangan bulat minimal 1, atau kosongkan untuk tanpa batas."
        );
        return;
      }

      const { data, error: updateError } = await supabase
        .from("pengaturan_booking")
        .update({
          kuota_harian: nilaiKuota,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1)
        .select("kuota_harian")
        .maybeSingle();

      if (updateError) {
        setErrorKuota(`Kuota gagal disimpan: ${updateError.message}`);
        return;
      }

      if (!data) {
        setErrorKuota(
          "Kuota tidak berubah. Periksa policy UPDATE untuk admin di Supabase."
        );
        return;
      }

      setKuotaHarian(
        data.kuota_harian == null ? "" : String(data.kuota_harian)
      );

      setNoticeKuota(
        data.kuota_harian == null
          ? "Berhasil! Kuota harian tanpa batas."
          : `Berhasil! Maksimal ${data.kuota_harian} booking per hari.`
      );

      await Promise.all([loadBookings(), loadKuota()]);
    } catch (err) {
      console.error("simpanKuota error:", err);
      setErrorKuota(
        err instanceof Error
          ? `Gagal menyimpan kuota: ${err.message}`
          : "Terjadi kesalahan saat menyimpan kuota."
      );
    } finally {
      setSavingKuota(false);
    }
  }

  async function simpanPengaturanJamServis(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingJamServis(true);
    setErrorJamServis("");
    setNoticeJamServis("");
    try {
      const interval = Number(jadwalServis.interval_menit);
      const kapasitas = Number(jadwalServis.kapasitas_per_rentang);
      if (!jadwalServis.jam_mulai || !jadwalServis.jam_selesai || jadwalServis.jam_mulai >= jadwalServis.jam_selesai) {
        throw new Error("Jam mulai harus lebih awal daripada jam selesai.");
      }
      if (!Number.isInteger(interval) || interval < 15 || interval > 240) {
        throw new Error("Interval harus bilangan bulat 15–240 menit.");
      }
      if (!Number.isInteger(kapasitas) || kapasitas < 1 || kapasitas > 100) {
        throw new Error("Kapasitas harus bilangan bulat 1–100 booking per rentang.");
      }
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { router.replace("/login?next=/admin"); return; }
      const { data: admin, error: adminError } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
      if (adminError || !admin) { router.replace("/"); return; }
      const { data, error } = await supabase.from("pengaturan_jadwal_servis").update({
        jam_mulai: `${jadwalServis.jam_mulai}:00`,
        jam_selesai: `${jadwalServis.jam_selesai}:00`,
        interval_menit: interval,
        kapasitas_per_rentang: kapasitas,
        aktif: jadwalServis.aktif,
        updated_at: new Date().toISOString(),
      }).eq("id", 1).select("id").maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Pengaturan tidak tersimpan. Pastikan policy UPDATE admin sudah diterapkan.");
      setNoticeJamServis("Pengaturan kedatangan berhasil disimpan.");
      await loadJamServis();
    } catch (err) {
      setErrorJamServis(err instanceof Error ? err.message : "Gagal menyimpan pengaturan jadwal.");
    } finally {
      setSavingJamServis(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    setSavingId(id);
    setError("");
    setNotice("");

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", id);

      if (updateError) {
        setError(`Status gagal diperbarui: ${updateError.message}`);
        return;
      }

      setNotice("Status booking berhasil diperbarui.");
      await loadBookings();
    } catch (err) {
      console.error("updateStatus error:", err);
      setError(
        err instanceof Error
          ? `Gagal memperbarui status: ${err.message}`
          : "Terjadi kesalahan saat memperbarui status."
      );
    } finally {
      setSavingId(null);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  // Semua perhitungan tanggal menunggu sampai waktu browser tersedia.
  const today = now ? localDateString(now) : "";
  const monday = now ? getMonday(now) : null;
  const sunday = monday ? new Date(monday) : null;

  if (sunday) {
    sunday.setDate(sunday.getDate() + 6);
  }

  const weekStart = monday ? localDateString(monday) : "";
  const weekEnd = sunday ? localDateString(sunday) : "";

  const lastSevenDays = now
    ? getLastSevenDays(now)
    : { start: "", end: "" };

  const bookingAktifHariIni = now
    ? bookings.filter(
        (b) =>
          b.created_at &&
          localDateString(new Date(b.created_at)) === today &&
          ACTIVE_STATUSES.includes(b.status)
      ).length
    : 0;

  const sisaKuotaHariIni =
    kuotaHarian.trim() === ""
      ? null
      : Math.max(0, Number(kuotaHarian) - bookingAktifHariIni);

  const completedThisWeek = bookings.filter(
    (b) =>
      b.status === "Selesai" &&
      !!weekStart &&
      isInRange(b.tanggal, weekStart, weekEnd)
  );

  const completedUnitsThisWeek = completedThisWeek.reduce(
    (total, b) => total + Math.max(0, b.jumlah_unit ?? 0),
    0
  );

  const waitingBookings = bookings.filter((b) =>
    ACTIVE_STATUSES.includes(b.status)
  );

  const dailyStats: DailyStat[] = monday
    ? WEEKDAYS.map((label, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        const dateString = localDateString(date);

        const units = completedThisWeek
          .filter((b) => b.tanggal === dateString)
          .reduce(
            (total, b) => total + Math.max(0, b.jumlah_unit ?? 0),
            0
          );

        return { label, date: dateString, units };
      })
    : [];

  const maxUnits = Math.max(1, ...dailyStats.map((day) => day.units));

  const recentHistory = bookings
    .filter(
      (b) =>
        b.status === "Selesai" &&
        !!lastSevenDays.start &&
        isInRange(b.tanggal, lastSevenDays.start, lastSevenDays.end)
    )
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  const upcomingBookings = bookings
    .filter(
      (b) =>
        !!today &&
        b.tanggal >= today &&
        (!selectedDate || b.tanggal === selectedDate) &&
        !["Selesai", "Dibatalkan"].includes(b.status)
    )
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
    .slice(0, 8);

  const historyUnits = recentHistory.reduce(
    (total, b) => total + Math.max(0, b.jumlah_unit ?? 0),
    0
  );

  const totalBookingsThisWeek = bookings.filter(
    (b) =>
      !!weekStart && isInRange(b.tanggal, weekStart, weekEnd)
  ).length;

  const dateRange = lastSevenDays.start
    ? `${formatDate(lastSevenDays.start)} – ${formatDate(lastSevenDays.end)}`
    : "Menghitung tanggal...";

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-2xl text-white">
              ❄
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold sm:text-xl">
                Dashboard Admin
              </h1>
              <p className="text-sm text-slate-500">
                Manajemen layanan AC
              </p>
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-2 text-sm sm:flex sm:flex-wrap">
            <Link
              href="/admin/produk"
              className="flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-2 py-3 text-center font-semibold hover:bg-slate-50 sm:px-3"
            >
              Kelola Produk
            </Link>
            <Link
              href="/admin/libur"
              className="flex min-h-11 items-center justify-center rounded-lg border border-amber-300 bg-amber-50 px-2 py-3 text-center font-semibold text-amber-900 hover:bg-amber-100 sm:px-3"
            >
              Kelola Tanggal Libur
            </Link>
            <Link
              href="/admin/laporan"
              className="flex min-h-11 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-3 text-center font-semibold text-emerald-900 hover:bg-emerald-100 sm:px-3"
            >
              Laporan Servis
            </Link>
            <a
              href="#pengaturan-jam-servis"
              className="flex min-h-11 items-center justify-center rounded-lg border border-violet-300 bg-violet-50 px-2 py-3 text-center font-semibold text-violet-900 hover:bg-violet-100 sm:px-3"
            >
              Pengaturan Jam Servis
            </a>
            <a
              href="#pengaturan-kuota"
              className="flex min-h-11 items-center justify-center rounded-lg border border-blue-300 bg-blue-50 px-2 py-3 text-center font-semibold text-blue-900 hover:bg-blue-100 sm:px-3"
            >
              Pengaturan Kuota
            </a>
            <a
              href="#kelola-booking"
              className="flex min-h-11 items-center justify-center rounded-lg bg-blue-700 px-2 py-3 text-center font-semibold text-white hover:bg-blue-800 sm:px-3"
            >
              Jadwal Booking
            </a>
            <button
              onClick={handleLogout}
              className="col-span-2 flex min-h-11 items-center justify-center rounded-lg bg-slate-900 px-3 py-3 font-semibold text-white hover:bg-slate-700 sm:col-span-1"
            >
              Keluar
            </button>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold sm:text-2xl">
              Ringkasan operasional
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Statistik minggu ini dan riwayat layanan terbaru.
            </p>
          </div>
          <button
            onClick={() => {
              void loadBookings();
              void loadKuota();
              void loadJamServis();
            }}
            disabled={loading || loadingKuota}
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
          >
            {loading || loadingKuota ? "Memuat..." : "↻ Refresh data"}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="break-words rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="break-words rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            {notice}
          </div>
        )}

        <section
          id="pengaturan-jam-servis"
          className="scroll-mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <h3 className="text-base font-bold sm:text-lg">Pengaturan Kedatangan Servis</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">Atur jam operasional dan kapasitas pelanggan pada setiap rentang. Ini adalah jadwal kedatangan, bukan estimasi durasi pengerjaan AC.</p>
          {errorJamServis && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorJamServis}</p>}
          {noticeJamServis && <p role="status" className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{noticeJamServis}</p>}
          {loadingJamServis ? <p className="mt-4 text-sm text-slate-500">Memuat pengaturan kedatangan...</p> : (
            <form onSubmit={simpanPengaturanJamServis} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="jamMulaiServis" className="mb-2 block text-sm font-semibold">Mulai operasional</label>
                  <input id="jamMulaiServis" type="time" required value={jadwalServis.jam_mulai} onChange={(e) => setJadwalServis((v) => ({ ...v, jam_mulai: e.target.value }))} disabled={savingJamServis} className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
                <div>
                  <label htmlFor="jamSelesaiServis" className="mb-2 block text-sm font-semibold">Selesai operasional</label>
                  <input id="jamSelesaiServis" type="time" required value={jadwalServis.jam_selesai} onChange={(e) => setJadwalServis((v) => ({ ...v, jam_selesai: e.target.value }))} disabled={savingJamServis} className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
                <div>
                  <label htmlFor="intervalServis" className="mb-2 block text-sm font-semibold">Panjang rentang (menit)</label>
                  <select id="intervalServis" value={jadwalServis.interval_menit} onChange={(e) => setJadwalServis((v) => ({ ...v, interval_menit: Number(e.target.value) }))} disabled={savingJamServis} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
                    {[15, 30, 45, 60, 90, 120, 180, 240].map((value) => <option key={value} value={value}>{value} menit</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="kapasitasServis" className="mb-2 block text-sm font-semibold">Maksimal pelanggan per rentang</label>
                  <input id="kapasitasServis" type="number" min={1} max={100} step={1} required value={jadwalServis.kapasitas_per_rentang} onChange={(e) => setJadwalServis((v) => ({ ...v, kapasitas_per_rentang: Number(e.target.value) }))} disabled={savingJamServis} className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
              </div>
              <label className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                <input type="checkbox" checked={jadwalServis.aktif} onChange={(e) => setJadwalServis((v) => ({ ...v, aktif: e.target.checked }))} disabled={savingJamServis} className="mt-1" />
                <span><strong>Terima booking kedatangan</strong><span className="block text-slate-500">Matikan sementara jika servis tidak menerima booking baru.</span></span>
              </label>
              <div className="rounded-lg border border-violet-100 bg-violet-50 p-3 text-sm text-violet-950">
                Contoh: 09.00–18.00, interval 60 menit, kapasitas 2 berarti tersedia rentang kedatangan pukul 09.00, 10.00, dan seterusnya sampai 17.00; tiap rentang menerima maksimal 2 pelanggan aktif. Jumlah unit AC tidak menambah hitungan kapasitas.
              </div>
              <button type="submit" disabled={savingJamServis} className="min-h-11 rounded-lg bg-violet-700 px-5 py-3 font-bold text-white hover:bg-violet-800 disabled:opacity-50">{savingJamServis ? "Menyimpan..." : "Simpan Pengaturan Kedatangan"}</button>
            </form>
          )}
        </section>

        <section
          id="pengaturan-kuota"
          className="scroll-mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-bold sm:text-lg">
                Pengaturan Kuota Booking Harian
              </h3>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                Atur jumlah pesanan booking yang diterima per tanggal, bukan
                jumlah unit AC.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">
              Admin
            </span>
          </div>

          {errorKuota && (
            <div
              role="alert"
              className="mt-4 break-words rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {errorKuota}
            </div>
          )}

          {noticeKuota && (
            <div
              role="status"
              className="mt-4 break-words rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
            >
              {noticeKuota}
            </div>
          )}

          <form
            onSubmit={simpanKuota}
            className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end"
          >
            <div className="min-w-0 flex-1">
              <label
                htmlFor="kuotaHarian"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Maksimal booking per hari
              </label>
              <input
                id="kuotaHarian"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={kuotaHarian}
                onChange={(e) => setKuotaHarian(e.target.value)}
                disabled={loadingKuota || savingKuota}
                placeholder="Contoh: 5"
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Masukkan bilangan bulat minimal 1. Kosongkan untuk tanpa batas.
                Status Menunggu, Dikonfirmasi, dan Diproses dihitung sebagai
                booking aktif.
              </p>
            </div>
            <button
              type="submit"
              disabled={loadingKuota || savingKuota}
              className="min-h-12 w-full rounded-xl bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {loadingKuota
                ? "Memuat kuota..."
                : savingKuota
                  ? "Menyimpan..."
                  : "Simpan Kuota"}
            </button>
          </form>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <IndicatorCard
            title="Booking aktif hari ini"
            value={!now || loading ? "..." : String(bookingAktifHariIni)}
            subtitle={today ? formatDate(today) : "Menghitung tanggal..."}
            color="blue"
          />
          <IndicatorCard
            title="Kuota harian"
            value={
              loadingKuota
                ? "..."
                : kuotaHarian.trim() === ""
                  ? "∞"
                  : kuotaHarian
            }
            subtitle={
              kuotaHarian.trim() === ""
                ? "Tanpa batas booking"
                : "Maksimal pesanan per hari"
            }
            color="slate"
          />
          <IndicatorCard
            title="Sisa slot hari ini"
            value={
              !now || loading || loadingKuota
                ? "..."
                : sisaKuotaHariIni === null
                  ? "∞"
                  : String(sisaKuotaHariIni)
            }
            subtitle={
              kuotaHarian.trim() === ""
                ? "Booking tidak dibatasi"
                : sisaKuotaHariIni === 0
                  ? "Kuota sudah penuh"
                  : "Slot booking tersedia"
            }
            color="green"
          />
        </section>

        {loading || !now ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 sm:p-10">
            {loading ? "Memuat dashboard..." : "Menyiapkan statistik..."}
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
              <StatCard
                title="Unit selesai minggu ini"
                value={`${completedUnitsThisWeek} unit`}
                subtitle={`${formatDate(weekStart)} – ${formatDate(weekEnd)}`}
                icon="❄"
                color="blue"
              />
              <StatCard
                title="Pekerjaan selesai"
                value={`${completedThisWeek.length} booking`}
                subtitle="Minggu kalender ini"
                icon="✓"
                color="green"
              />
              <StatCard
                title="Booking aktif"
                value={`${waitingBookings.length} booking`}
                subtitle="Menunggu, dikonfirmasi, atau diproses"
                icon="◷"
                color="amber"
              />
              <StatCard
                title="Unit selesai 7 hari"
                value={`${historyUnits} unit`}
                subtitle={dateRange}
                icon="↗"
                color="violet"
              />
            </section>

            <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-3 xl:gap-6">
              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 xl:col-span-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold sm:text-lg">
                      Grafik unit selesai diservis
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Berdasarkan tanggal service, Senin–Minggu.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    {completedUnitsThisWeek} unit
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-7 gap-1.5 sm:mt-7 sm:gap-4">
                  {dailyStats.map((day) => (
                    <div
                      key={day.date}
                      className="flex min-w-0 flex-col items-center justify-end gap-2"
                    >
                      <span className="text-[11px] font-bold text-slate-700 sm:text-xs">
                        {day.units}
                      </span>
                      <div className="flex h-32 w-full items-end justify-center rounded-t-md bg-slate-100 sm:h-40">
                        <div
                          className="w-full max-w-10 rounded-t-md bg-blue-600 transition-all"
                          style={{
                            height: `${Math.max(
                              day.units > 0 ? 5 : 0,
                              (day.units / maxUnits) * 100
                            )}%`,
                          }}
                          title={`${day.units} unit`}
                        />
                      </div>
                      <span className="text-[11px] text-slate-500 sm:text-xs">
                        {day.label}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-xs leading-5 text-slate-400">
                  Angka dihitung dari booking berstatus Selesai dan tanggal
                  service pada minggu berjalan.
                </p>
              </div>

              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <h3 className="text-base font-bold sm:text-lg">
                  Ringkasan booking
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Booking dengan tanggal minggu ini.
                </p>

                <div className="mt-5 space-y-4">
                  <SummaryRow
                    label="Total booking minggu ini"
                    value={String(totalBookingsThisWeek)}
                  />
                  <SummaryRow
                    label="Selesai"
                    value={String(completedThisWeek.length)}
                  />
                  <SummaryRow
                    label="Menunggu / aktif"
                    value={String(waitingBookings.length)}
                  />
                  <SummaryRow
                    label="Riwayat selesai 7 hari"
                    value={String(recentHistory.length)}
                  />
                </div>

                <div className="mt-6 rounded-xl bg-blue-50 p-4">
                  <p className="text-sm font-bold text-blue-900">
                    Info periode
                  </p>
                  <p className="mt-1 text-xs leading-5 text-blue-800">
                    Grafik mengikuti minggu kalender. Riwayat memakai tujuh
                    hari terakhir, termasuk hari ini. Data lama tidak dihapus.
                  </p>
                </div>
              </div>
            </section>

            <section
              id="kelola-booking"
              className="scroll-mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold">Jadwal service</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Jadwal mendatang yang belum selesai atau dibatalkan.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label
                    htmlFor="filterTanggal"
                    className="text-sm font-medium text-slate-600"
                  >
                    Filter tanggal
                  </label>
                  <input
                    id="filterTanggal"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 sm:w-auto"
                  />
                  {selectedDate && (
                    <button
                      onClick={() => setSelectedDate("")}
                      className="min-h-11 rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-50"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {upcomingBookings.length === 0 ? (
                <p className="mt-5 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500 sm:p-6">
                  Belum ada jadwal service mendatang.
                </p>
              ) : (
                <div className="mt-5 space-y-3">
                  {upcomingBookings.map((booking) => (
                    <BookingRow
                      key={booking.id}
                      booking={booking}
                      saving={savingId === booking.id}
                      onStatusChange={(status) =>
                        void updateStatus(booking.id, status)
                      }
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold">
                    Riwayat service 7 hari terakhir
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {dateRange}. Hanya booking berstatus Selesai.
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 px-4 py-3">
                  <p className="text-xs font-medium text-emerald-700">
                    Unit terselesaikan
                  </p>
                  <p className="text-xl font-extrabold text-emerald-900">
                    {historyUnits} unit
                  </p>
                </div>
              </div>

              {recentHistory.length === 0 ? (
                <p className="mt-5 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500 sm:p-6">
                  Belum ada service selesai dalam tujuh hari terakhir.
                </p>
              ) : (
                <div className="mt-5 overflow-x-auto rounded-lg border border-slate-100">
                  <table className="w-full min-w-[600px] text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="px-3 py-3 font-semibold">Tanggal</th>
                        <th className="px-3 py-3 font-semibold">Layanan</th>
                        <th className="px-3 py-3 font-semibold">Unit</th>
                        <th className="px-3 py-3 font-semibold">Alamat</th>
                        <th className="px-3 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentHistory.map((booking) => (
                        <tr
                          key={booking.id}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="whitespace-nowrap px-3 py-4">
                            {formatDate(booking.tanggal)}
                          </td>
                          <td className="px-3 py-4 font-medium">
                            {booking.layanan}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4">
                            {booking.jumlah_unit ?? 0} unit
                          </td>
                          <td className="max-w-xs px-3 py-4 text-slate-600">
                            {booking.alamat || "-"}
                          </td>
                          <td className="px-3 py-4">
                            <span className="whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                              Selesai
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        <footer className="pb-5 pt-1 text-center text-xs text-slate-400">
          Dashboard Admin AC · Data tersimpan di Supabase
        </footer>
      </div>
    </main>
  );
}

function IndicatorCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  color: "blue" | "slate" | "green";
}) {
  const styles = {
    blue: {
      border: "border-blue-100",
      number: "text-blue-700",
    },
    slate: {
      border: "border-slate-200",
      number: "text-slate-900",
    },
    green: {
      border: "border-emerald-100",
      number: "text-emerald-700",
    },
  };

  return (
    <div
      className={`min-w-0 rounded-2xl border ${styles[color].border} bg-white p-4 shadow-sm sm:p-5`}
    >
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p
        className={`mt-2 break-words text-3xl font-extrabold ${styles[color].number}`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: "blue" | "green" | "amber" | "violet";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${colors[color]}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-4 break-words text-2xl font-extrabold">{value}</p>
      <p className="mt-1 break-words text-xs leading-5 text-slate-500">
        {subtitle}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="min-w-0 text-sm text-slate-600">{label}</span>
      <span className="shrink-0 font-bold text-slate-900">{value}</span>
    </div>
  );
}


function BookingRow({
  booking,
  saving,
  onStatusChange,
}: {
  booking: Booking;
  saving: boolean;
  onStatusChange: (status: string) => void;
}) {
  const statusColor =
    booking.status === "Menunggu"
      ? "bg-amber-50 text-amber-800"
      : booking.status === "Diproses"
        ? "bg-blue-50 text-blue-800"
        : booking.status === "Dikonfirmasi"
          ? "bg-violet-50 text-violet-800"
          : booking.status === "Selesai"
            ? "bg-emerald-50 text-emerald-800"
            : booking.status === "Dibatalkan"
              ? "bg-red-50 text-red-800"
              : "bg-slate-100 text-slate-700";

  return (
    <article className="grid min-w-0 gap-4 rounded-xl border border-slate-200 p-3 sm:p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="break-words font-bold">{booking.layanan}</h4>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${statusColor}`}
          >
            {booking.status}
          </span>
        </div>

        <p className="mt-1 text-sm text-slate-500">
          {formatDate(booking.tanggal)}{booking.jam_servis ? ` · ${booking.jam_servis.slice(0, 5)}` : " · Jam belum dipilih"} · {booking.jumlah_unit ?? 0} unit AC
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Booking dibuat: {booking.created_at ? new Date(booking.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-"}
        </p>

        <div className="mt-3 space-y-2 rounded-lg border border-blue-100 bg-blue-50 p-3">
          <p className="break-words text-sm text-slate-800">
            <span className="font-semibold">Nama pelanggan:</span>{" "}
            {booking.nama || "Nama belum tersedia"}
          </p>

          <p className="break-words text-sm text-slate-800">
            <span className="font-semibold">WhatsApp:</span>{" "}
            {booking.telepon || "Nomor belum tersedia"}
          </p>
        </div>

        <p className="mt-3 break-words text-sm text-slate-700">
          <span className="font-semibold">Alamat:</span>{" "}
          {booking.alamat || "Alamat belum diisi"}
        </p>

        {booking.keluhan && (
          <p className="mt-1 break-words text-sm text-slate-500">
            <span className="font-semibold">Keluhan:</span>{" "}
            {booking.keluhan}
          </p>
        )}

        <p className="mt-2 break-all text-xs text-slate-400">
          ID booking: {booking.id}
        </p>
      </div>

      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        <label
          className="text-xs font-medium text-slate-500 md:sr-only"
          htmlFor={`status-${booking.id}`}
        >
          Ubah status booking
        </label>

        <select
          id={`status-${booking.id}`}
          value={booking.status}
          disabled={saving}
          onChange={(e) => onStatusChange(e.target.value)}
          className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:opacity-50 sm:w-auto"
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        {saving && (
          <span className="text-xs text-slate-500">Menyimpan...</span>
        )}
      </div>
    </article>
  );
}
