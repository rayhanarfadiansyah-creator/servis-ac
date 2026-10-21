
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

type ScheduleSetting = {
  jam_mulai?: string | null;
  jam_selesai?: string | null;
  interval_menit?: number | null;
  kapasitas_per_rentang?: number | null;
  aktif?: boolean | null;
};

type ReportType = "bulanan" | "pelanggan" | "jadwal";

const STATUS_OPTIONS = [
  "Semua",
  "Menunggu",
  "Dikonfirmasi",
  "Diproses",
  "Selesai",
  "Dibatalkan",
];

const ACTIVE_STATUSES = ["Menunggu", "Dikonfirmasi", "Diproses"];

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
}

function monthStartString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-01`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value?: string | null) {
  return value ? value.slice(0, 5) : "-";
}

function toMinutes(value?: string | null) {
  if (!value) return 0;
  const [hours, minutes] = value.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function toTimeString(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(
    2,
    "0"
  )}`;
}

function escapePdfText(value: unknown) {
  return String(value ?? "-").replace(/\s+/g, " ").trim();
}

export default function AdminLaporanPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [schedule, setSchedule] = useState<ScheduleSetting | null>(null);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [reportType, setReportType] = useState<ReportType>("bulanan");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [customerSearch, setCustomerSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const supabase = createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/login?next=/admin/laporan");
          return;
        }

        const { data: admin, error: adminError } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (adminError || !admin) {
          router.replace("/");
          return;
        }

        const { data: bookingData, error: bookingError } = await supabase
          .from("bookings")
          .select(
            "id, user_id, nama, telepon, layanan, tanggal, jam_servis, jumlah_unit, alamat, keluhan, status, created_at"
          )
          .order("tanggal", { ascending: false });

        if (bookingError) throw bookingError;

        const { data: scheduleData } = await supabase
          .from("pengaturan_jadwal_servis")
          .select("*")
          .eq("id", 1)
          .maybeSingle();

        const { data: holidayData } = await supabase
          .from("tanggal_libur")
          .select("*");

        if (cancelled) return;

        setBookings((bookingData ?? []) as Booking[]);
        setSchedule((scheduleData ?? null) as ScheduleSetting | null);

        // Mendukung nama kolom tanggal yang umum dipakai.
        setHolidays(
          (holidayData ?? [])
            .map((item: Record<string, unknown>) =>
              String(item.tanggal ?? item.tanggal_libur ?? "")
            )
            .filter(Boolean)
            .map((value) => value.slice(0, 10))
        );
      } catch (err) {
        if (!cancelled) {
          console.error("Gagal memuat laporan:", err);
          setError(
            "Data laporan gagal dimuat. Periksa koneksi atau konfigurasi akses database."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const filteredBookings = useMemo(() => {
    const search = customerSearch.trim().toLowerCase();

    return bookings.filter((booking) => {
      const date = booking.tanggal?.slice(0, 10) ?? "";
      const inRange =
        (!startDate || date >= startDate) && (!endDate || date <= endDate);
      const matchesStatus =
        statusFilter === "Semua" || booking.status === statusFilter;
      const matchesCustomer =
        !search ||
        booking.nama?.toLowerCase().includes(search) ||
        booking.telepon?.toLowerCase().includes(search);

      return inRange && matchesStatus && matchesCustomer;
    });
  }, [bookings, startDate, endDate, statusFilter, customerSearch]);

  const customerRows = useMemo(() => {
    const grouped = new Map<
      string,
      {
        nama: string;
        telepon: string;
        jumlahBooking: number;
        jumlahUnit: number;
        tanggalTerakhir: string;
        layanan: Set<string>;
        status: Set<string>;
      }
    >();

    for (const booking of filteredBookings) {
      const key = `${booking.telepon || ""}__${booking.nama || ""}`;
      const current = grouped.get(key);

      if (!current) {
        grouped.set(key, {
          nama: booking.nama || "-",
          telepon: booking.telepon || "-",
          jumlahBooking: 1,
          jumlahUnit: Number(booking.jumlah_unit || 0),
          tanggalTerakhir: booking.tanggal || "",
          layanan: new Set([booking.layanan || "-"]),
          status: new Set([booking.status || "-"]),
        });
      } else {
        current.jumlahBooking += 1;
        current.jumlahUnit += Number(booking.jumlah_unit || 0);
        if (booking.tanggal > current.tanggalTerakhir) {
          current.tanggalTerakhir = booking.tanggal;
        }
        current.layanan.add(booking.layanan || "-");
        current.status.add(booking.status || "-");
      }
    }

    return Array.from(grouped.values()).sort(
      (a, b) => b.jumlahBooking - a.jumlahBooking
    );
  }, [filteredBookings]);

  const scheduleRows = useMemo(() => {
    const rows: {
      tanggal: string;
      jam: string;
      jumlahBooking: number;
      kapasitas: number;
      status: string;
    }[] = [];

    if (!schedule?.jam_mulai || !schedule?.jam_selesai) return rows;

    const start = toMinutes(schedule.jam_mulai);
    const end = toMinutes(schedule.jam_selesai);
    const interval = Math.max(1, Number(schedule.interval_menit || 60));
    const capacity = Math.max(1, Number(schedule.kapasitas_per_rentang || 1));

    if (end <= start || !startDate || !endDate || startDate > endDate) {
      return rows;
    }

    // Batasi rentang agar laporan tidak membuat terlalu banyak baris.
    const first = new Date(`${startDate}T00:00:00`);
    const last = new Date(`${endDate}T00:00:00`);
    const days = Math.floor((last.getTime() - first.getTime()) / 86400000) + 1;
    if (days < 1 || days > 90) return rows;

    for (let offset = 0; offset < days; offset++) {
      const date = new Date(first);
      date.setDate(first.getDate() + offset);
      const dateString = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      for (let minute = start; minute < end; minute += interval) {
        const time = toTimeString(minute);
        const count = bookings.filter((booking) => {
          return (
            booking.tanggal?.slice(0, 10) === dateString &&
            formatTime(booking.jam_servis) === time &&
            ACTIVE_STATUSES.includes(booking.status)
          );
        }).length;

        const isHoliday = holidays.includes(dateString);
        let status = "Tersedia";

        if (schedule.aktif === false) status = "Jadwal nonaktif";
        else if (isHoliday) status = "Hari libur";
        else if (count >= capacity) status = "Penuh";

        rows.push({
          tanggal: dateString,
          jam: time,
          jumlahBooking: count,
          kapasitas: capacity,
          status,
        });
      }
    }

    return rows;
  }, [bookings, schedule, holidays, startDate, endDate]);

  const totalUnit = filteredBookings.reduce(
    (total, booking) => total + Number(booking.jumlah_unit || 0),
    0
  );

  const statusCount = (status: string) =>
    filteredBookings.filter((booking) => booking.status === status).length;

  const reportTitle =
    reportType === "bulanan"
      ? "Rekap Servis"
      : reportType === "pelanggan"
      ? "Riwayat Servis Pelanggan"
      : "Jadwal dan Kapasitas";

  function downloadPdf() {
    if (startDate && endDate && startDate > endDate) {
      setError("Tanggal mulai tidak boleh melewati tanggal akhir.");
      return;
    }

    if (reportType === "jadwal" && scheduleRows.length === 0) {
      setError(
        "Jadwal tidak bisa dibuat. Pastikan pengaturan jadwal tersedia dan rentang tanggal maksimal 90 hari."
      );
      return;
    }

    setDownloading(true);
    setError("");

    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(18);
      doc.text("Laporan Servis AC", 14, 16);
      doc.setFontSize(11);
      doc.text(reportTitle, 14, 23);
      doc.setFontSize(9);
      doc.text(
        `Periode: ${formatDate(startDate)} - ${formatDate(endDate)}`,
        14,
        29
      );
      doc.text(
        `Dibuat: ${new Date().toLocaleString("id-ID")}`,
        pageWidth - 14,
        16,
        { align: "right" }
      );

      if (reportType === "bulanan") {
        doc.setFontSize(10);
        doc.text(
          `Total booking: ${filteredBookings.length} | Total unit: ${totalUnit} | Menunggu: ${statusCount(
            "Menunggu"
          )} | Dikonfirmasi: ${statusCount(
            "Dikonfirmasi"
          )} | Diproses: ${statusCount("Diproses")} | Selesai: ${statusCount(
            "Selesai"
          )} | Dibatalkan: ${statusCount("Dibatalkan")}`,
          14,
          36
        );

        autoTable(doc, {
          startY: 42,
          head: [[
            "Tanggal",
            "Jam",
            "Pelanggan",
            "Telepon",
            "Layanan",
            "Unit",
            "Status",
          ]],
          body: filteredBookings.map((booking) => [
            formatDate(booking.tanggal),
            formatTime(booking.jam_servis),
            escapePdfText(booking.nama),
            escapePdfText(booking.telepon),
            escapePdfText(booking.layanan),
            String(booking.jumlah_unit ?? 0),
            escapePdfText(booking.status),
          ]),
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [30, 64, 175] },
          margin: { left: 14, right: 14 },
        });
      } else if (reportType === "pelanggan") {
        doc.setFontSize(10);
        doc.text(`Jumlah pelanggan: ${customerRows.length}`, 14, 36);

        autoTable(doc, {
          startY: 42,
          head: [[
            "Pelanggan",
            "Telepon",
            "Jumlah Booking",
            "Total Unit",
            "Servis Terakhir",
            "Layanan",
            "Status Tercatat",
          ]],
          body: customerRows.map((customer) => [
            escapePdfText(customer.nama),
            escapePdfText(customer.telepon),
            String(customer.jumlahBooking),
            String(customer.jumlahUnit),
            formatDate(customer.tanggalTerakhir),
            escapePdfText(Array.from(customer.layanan).join(", ")),
            escapePdfText(Array.from(customer.status).join(", ")),
          ]),
          styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
          headStyles: { fillColor: [30, 64, 175] },
          margin: { left: 14, right: 14 },
        });
      } else {
        const available = scheduleRows.filter(
          (row) => row.status === "Tersedia"
        ).length;
        const full = scheduleRows.filter((row) => row.status === "Penuh").length;

        doc.setFontSize(10);
        doc.text(
          `Total slot: ${scheduleRows.length} | Tersedia: ${available} | Penuh: ${full}`,
          14,
          36
        );

        autoTable(doc, {
          startY: 42,
          head: [[
            "Tanggal",
            "Jam",
            "Booking Aktif",
            "Kapasitas",
            "Status Slot",
          ]],
          body: scheduleRows.map((row) => [
            formatDate(row.tanggal),
            row.jam,
            String(row.jumlahBooking),
            String(row.kapasitas),
            row.status,
          ]),
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [30, 64, 175] },
          margin: { left: 14, right: 14 },
        });
      }

      const pageCount = doc.getNumberOfPages();
      for (let page = 1; page <= pageCount; page++) {
        doc.setPage(page);
        doc.setFontSize(8);
        doc.text(
          `Laporan Servis AC - Halaman ${page} dari ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 7,
          { align: "center" }
        );
      }

      doc.save(
        `laporan-${reportType}-${startDate || "awal"}-${endDate || "akhir"}.pdf`
      );
    } catch (err) {
      console.error("Gagal membuat PDF:", err);
      setError("PDF gagal dibuat. Coba lagi setelah halaman dimuat ulang.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-blue-700">ADMIN</p>
            <h1 className="mt-1 text-3xl font-bold">Laporan Servis</h1>
            <p className="mt-2 text-sm text-slate-600">
              Lihat rekap servis, riwayat pelanggan, dan kapasitas jadwal.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100"
          >
            ← Kembali ke Admin
          </button>
        </div>

        <section className="grid gap-3 sm:grid-cols-3">
          {([
            ["bulanan", "Rekap Servis", "Daftar booking dan status servis"],
            ["pelanggan", "Riwayat Pelanggan", "Ringkasan servis per pelanggan"],
            ["jadwal", "Jadwal & Kapasitas", "Slot jadwal, kuota, dan slot penuh"],
          ] as const).map(([type, title, description]) => (
            <button
              key={type}
              type="button"
              onClick={() => setReportType(type)}
              className={`rounded-2xl border p-4 text-left transition ${
                reportType === type
                  ? "border-blue-700 bg-blue-50 ring-2 ring-blue-100"
                  : "border-slate-200 bg-white hover:border-blue-300"
              }`}
            >
              <span className="font-semibold">{title}</span>
              <span className="mt-1 block text-sm text-slate-600">
                {description}
              </span>
            </button>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Filter laporan</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm font-medium">
              Tanggal mulai
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 font-normal"
              />
            </label>
            <label className="text-sm font-medium">
              Tanggal akhir
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 font-normal"
              />
            </label>

            {reportType !== "jadwal" && (
              <label className="text-sm font-medium">
                Status booking
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 font-normal"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {reportType === "pelanggan" && (
              <label className="text-sm font-medium">
                Cari pelanggan
                <input
                  type="search"
                  value={customerSearch}
                  onChange={(event) => setCustomerSearch(event.target.value)}
                  placeholder="Nama atau nomor telepon"
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 font-normal"
                />
              </label>
            )}
          </div>

          {reportType === "jadwal" && (
            <p className="mt-3 text-sm text-slate-500">
              Laporan jadwal dibatasi maksimal 90 hari per unduhan.
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={downloadPdf}
              disabled={loading || downloading}
              className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloading ? "Menyiapkan PDF..." : "↓ Unduh PDF"}
            </button>
            <span className="text-sm text-slate-500">
              Periode {formatDate(startDate)} – {formatDate(endDate)}
            </span>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            Memuat data laporan...
          </div>
        ) : (
          <>
            {reportType === "bulanan" && (
              <>
                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Total booking", filteredBookings.length],
                    ["Total unit", totalUnit],
                    ["Servis selesai", statusCount("Selesai")],
                    ["Booking dibatalkan", statusCount("Dibatalkan")],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-slate-200 bg-white p-5"
                    >
                      <p className="text-sm text-slate-500">{label}</p>
                      <p className="mt-2 text-3xl font-bold">{value}</p>
                    </div>
                  ))}
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 p-4">
                    <h2 className="font-semibold">Detail booking servis</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {filteredBookings.length} booking sesuai filter.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-100 text-slate-600">
                        <tr>
                          {["Tanggal", "Jam", "Pelanggan", "Layanan", "Unit", "Status"].map(
                            (heading) => (
                              <th key={heading} className="px-4 py-3 font-semibold">
                                {heading}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredBookings.map((booking) => (
                          <tr key={booking.id}>
                            <td className="whitespace-nowrap px-4 py-3">
                              {formatDate(booking.tanggal)}
                            </td>
                            <td className="px-4 py-3">
                              {formatTime(booking.jam_servis)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium">{booking.nama}</div>
                              <div className="text-slate-500">{booking.telepon}</div>
                            </td>
                            <td className="px-4 py-3">{booking.layanan || "-"}</td>
                            <td className="px-4 py-3">{booking.jumlah_unit ?? 0}</td>
                            <td className="px-4 py-3">{booking.status}</td>
                          </tr>
                        ))}
                        {filteredBookings.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                              Tidak ada booking pada filter ini.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            {reportType === "pelanggan" && (
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 p-4">
                  <h2 className="font-semibold">Riwayat servis per pelanggan</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {customerRows.length} pelanggan sesuai filter.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        {[
                          "Pelanggan",
                          "Telepon",
                          "Jumlah booking",
                          "Total unit",
                          "Servis terakhir",
                          "Layanan",
                        ].map((heading) => (
                          <th key={heading} className="px-4 py-3 font-semibold">
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customerRows.map((customer) => (
                        <tr key={`${customer.telepon}-${customer.nama}`}>
                          <td className="px-4 py-3 font-medium">{customer.nama}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {customer.telepon}
                          </td>
                          <td className="px-4 py-3">{customer.jumlahBooking}</td>
                          <td className="px-4 py-3">{customer.jumlahUnit}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {formatDate(customer.tanggalTerakhir)}
                          </td>
                          <td className="px-4 py-3">
                            {Array.from(customer.layanan).join(", ")}
                          </td>
                        </tr>
                      ))}
                      {customerRows.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                            Tidak ada riwayat pelanggan pada filter ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {reportType === "jadwal" && (
              <>
                <section className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["Total slot", scheduleRows.length],
                    [
                      "Slot tersedia",
                      scheduleRows.filter((row) => row.status === "Tersedia").length,
                    ],
                    [
                      "Slot penuh",
                      scheduleRows.filter((row) => row.status === "Penuh").length,
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-slate-200 bg-white p-5"
                    >
                      <p className="text-sm text-slate-500">{label}</p>
                      <p className="mt-2 text-3xl font-bold">{value}</p>
                    </div>
                  ))}
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 p-4">
                    <h2 className="font-semibold">Jadwal dan kapasitas per slot</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Booking aktif dihitung dari status Menunggu, Dikonfirmasi, dan Diproses.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-100 text-slate-600">
                        <tr>
                          {["Tanggal", "Jam", "Booking aktif", "Kapasitas", "Status"].map(
                            (heading) => (
                              <th key={heading} className="px-4 py-3 font-semibold">
                                {heading}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {scheduleRows.map((row) => (
                          <tr key={`${row.tanggal}-${row.jam}`}>
                            <td className="whitespace-nowrap px-4 py-3">
                              {formatDate(row.tanggal)}
                            </td>
                            <td className="px-4 py-3">{row.jam}</td>
                            <td className="px-4 py-3">{row.jumlahBooking}</td>
                            <td className="px-4 py-3">{row.kapasitas}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  row.status === "Penuh"
                                    ? "bg-red-100 text-red-700"
                                    : row.status === "Tersedia"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {scheduleRows.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                              Jadwal belum tersedia atau rentang tanggal tidak valid.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
