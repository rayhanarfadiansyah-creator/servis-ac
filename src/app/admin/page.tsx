"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Booking = {
  id: string;
  user_id: string;
  layanan: string;
  tanggal: string;
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

function getLastSevenDays() {
  const today = new Date();
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

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");

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
        setError(
          "Gagal memeriksa akses admin. Pastikan tabel admin_users dan policy RLS sudah benar."
        );
        return;
      }

      if (!admin) {
        router.replace("/");
        return;
      }

      let query = supabase
        .from("bookings")
        .select(
          "id, user_id, layanan, tanggal, jumlah_unit, alamat, keluhan, status, created_at"
        )
        .order("tanggal", { ascending: true });

      const { data, error: bookingsError } = await query;

      if (bookingsError) {
        setError(`Gagal mengambil booking: ${bookingsError.message}`);
        return;
      }

      setBookings((data ?? []) as Booking[]);
    } catch {
      setError("Terjadi kesalahan saat memuat dashboard.");
    } finally {
      setLoading(false);
    }
  }, [router, selectedDate]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

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
    } catch {
      setError("Terjadi kesalahan saat memperbarui status.");
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

  const today = localDateString(new Date());
  const monday = getMonday(new Date());
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  const weekStart = localDateString(monday);
  const weekEnd = localDateString(sunday);
  const lastSevenDays = getLastSevenDays();

  // Statistik grafik mengikuti minggu kalender Senin–Minggu.
  const completedThisWeek = bookings.filter(
    (b) =>
      b.status === "Selesai" &&
      isInRange(b.tanggal, weekStart, weekEnd)
  );

  const completedUnitsThisWeek = completedThisWeek.reduce(
    (total, b) => total + Math.max(0, b.jumlah_unit ?? 0),
    0
  );

  const waitingBookings = bookings.filter(
    (b) => ["Menunggu", "Dikonfirmasi", "Diproses"].includes(b.status)
  );

  const dailyStats: DailyStat[] = WEEKDAYS.map((label, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const dateString = localDateString(date);

    const units = completedThisWeek
      .filter((b) => b.tanggal === dateString)
      .reduce((total, b) => total + Math.max(0, b.jumlah_unit ?? 0), 0);

    return { label, date: dateString, units };
  });

  const maxUnits = Math.max(1, ...dailyStats.map((day) => day.units));

  // Riwayat tujuh hari terakhir. Data lama tidak dihapus.
  const recentHistory = bookings
    .filter(
      (b) =>
        b.status === "Selesai" &&
        isInRange(b.tanggal, lastSevenDays.start, lastSevenDays.end)
    )
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  // Jadwal mendatang yang belum selesai atau dibatalkan.
 
const upcomingBookings = bookings
  .filter(
    (b) =>
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

  const totalBookingsThisWeek = bookings.filter((b) =>
    isInRange(b.tanggal, weekStart, weekEnd)
  ).length;

  const rupiahDateRange = `${formatDate(lastSevenDays.start)} – ${formatDate(
    lastSevenDays.end
  )}`;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-2xl text-white">
              ❄
            </div>
            <div>
              <h1 className="text-xl font-extrabold">Dashboard Admin</h1>
              <p className="text-sm text-slate-500">
                Manajemen layanan AC
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/admin/produk"
              className="rounded-lg border border-slate-300 px-4 py-2 font-semibold hover:bg-slate-50"
            >
              Kelola Produk
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700"
            >
              Keluar
            </button>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold">
              Ringkasan operasional
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Statistik minggu ini dan riwayat layanan terbaru.
            </p>
          </div>
          <button
            onClick={() => void loadBookings()}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? "Memuat..." : "↻ Refresh data"}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {notice && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {notice}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            Memuat dashboard...
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Unit selesai minggu ini"
                value={`${completedUnitsThisWeek} unit`}
                subtitle={`${weekStart} sampai ${weekEnd}`}
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
                subtitle={rupiahDateRange}
                icon="↗"
                color="violet"
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold">
                      Grafik unit selesai diservis
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Berdasarkan tanggal service, Senin–Minggu.
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    {completedUnitsThisWeek} unit
                  </span>
                </div>

                <div className="mt-7 grid h-56 grid-cols-7 gap-2 sm:gap-4">
                  {dailyStats.map((day) => (
                    <div
                      key={day.date}
                      className="flex min-w-0 flex-col items-center justify-end gap-2"
                    >
                      <span className="text-xs font-bold text-slate-700">
                        {day.units}
                      </span>
                      <div className="flex h-40 w-full items-end justify-center rounded-t-md bg-slate-100">
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
                      <span className="text-xs text-slate-500">
                        {day.label}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-xs text-slate-400">
                  Angka dihitung dari booking berstatus Selesai dan tanggal
                  service pada minggu berjalan.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold">Ringkasan booking</h3>
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

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">Jadwal service</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Jadwal mendatang yang belum selesai atau dibatalkan.
                  </p>
                </div>
                <label className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium text-slate-600">
                    Filter tanggal:
                  </span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                  />
                  {selectedDate && (
                    <button
                      onClick={() => setSelectedDate("")}
                      className="rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-50"
                    >
                      Reset
                    </button>
                  )}
                </label>
              </div>

              {upcomingBookings.length === 0 ? (
                <p className="mt-6 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
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

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">
                    Riwayat service 7 hari terakhir
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {rupiahDateRange}. Hanya booking berstatus Selesai.
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
                <p className="mt-5 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Belum ada service selesai dalam tujuh hari terakhir.
                </p>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead>
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
                          <td className="px-3 py-4">
                            {formatDate(booking.tanggal)}
                          </td>
                          <td className="px-3 py-4 font-medium">
                            {booking.layanan}
                          </td>
                          <td className="px-3 py-4">
                            {booking.jumlah_unit ?? 0} unit
                          </td>
                          <td className="max-w-xs px-3 py-4 text-slate-600">
                            {booking.alamat || "-"}
                          </td>
                          <td className="px-3 py-4">
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
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

        <footer className="pb-5 text-center text-xs text-slate-400">
          Dashboard Admin AC · Data tersimpan di Supabase
        </footer>
      </div>
    </main>
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${colors[color]}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-4 text-2xl font-extrabold">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
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
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
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
        : "bg-violet-50 text-violet-800";

  return (
    <div className="grid gap-4 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_auto] md:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-bold">{booking.layanan}</h4>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${statusColor}`}
          >
            {booking.status}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {formatDate(booking.tanggal)} · {booking.jumlah_unit ?? 0} unit AC
        </p>
        <p className="mt-2 break-words text-sm text-slate-700">
          {booking.alamat || "Alamat belum diisi"}
        </p>
        {booking.keluhan && (
          <p className="mt-1 break-words text-sm text-slate-500">
            Keluhan: {booking.keluhan}
          </p>
        )}
        <p className="mt-1 text-xs text-slate-400">
          ID booking: {booking.id}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={`status-${booking.id}`}>
          Ubah status booking
        </label>
        <select
          id={`status-${booking.id}`}
          value={booking.status}
          disabled={saving}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:opacity-50"
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
    </div>
  );
}
