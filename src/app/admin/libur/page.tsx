
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Holiday = {
  id: number;
  tanggal: string;
  keterangan: string;
};

export default function KelolaTanggalLiburPage() {
  const router = useRouter();
  const supabase = createClient();

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [tanggal, setTanggal] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadHolidays = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      router.replace("/admin/login");
      return;
    }

    const { data: admin, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (adminError || !admin) {
      setError("Akun ini tidak memiliki akses admin.");
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("tanggal_libur")
      .select("id, tanggal, keterangan")
      .order("tanggal", { ascending: true });

    if (fetchError) {
      setError("Gagal mengambil tanggal libur: " + fetchError.message);
    } else {
      setHolidays((data ?? []) as Holiday[]);
    }

    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    void loadHolidays();
  }, [loadHolidays]);

  async function tambahTanggalLibur(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!tanggal) {
      setError("Pilih tanggal libur terlebih dahulu.");
      return;
    }

    setSaving(true);

    const { error: insertError } = await supabase
      .from("tanggal_libur")
      .insert({
        tanggal,
        keterangan: keterangan.trim() || "Libur servis",
      });

    setSaving(false);

    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "Tanggal tersebut sudah terdaftar sebagai hari libur."
          : "Gagal menyimpan tanggal libur: " + insertError.message
      );
      return;
    }

    setTanggal("");
    setKeterangan("");
    setMessage("Tanggal libur berhasil ditambahkan.");
    await loadHolidays();
  }

  async function hapusTanggalLibur(holiday: Holiday) {
    const yakin = window.confirm(
      `Hapus tanggal libur ${holiday.tanggal} (${holiday.keterangan})?`
    );

    if (!yakin) return;

    setDeletingId(holiday.id);
    setError("");
    setMessage("");

    const { error: deleteError } = await supabase
      .from("tanggal_libur")
      .delete()
      .eq("id", holiday.id);

    setDeletingId(null);

    if (deleteError) {
      setError("Gagal menghapus tanggal libur: " + deleteError.message);
      return;
    }

    setMessage("Tanggal libur berhasil dihapus.");
    await loadHolidays();
  }

  function formatTanggal(value: string) {
    return new Date(value + "T00:00:00").toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin"
          className="text-sm font-semibold text-blue-700 hover:underline"
        >
          ← Kembali ke dashboard admin
        </Link>

        <header className="mb-8 mt-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            Pengaturan jadwal
          </p>
          <h1 className="mt-2 text-3xl font-bold">Kelola Tanggal Libur</h1>
          <p className="mt-2 text-slate-600">
            Atur tanggal ketika layanan servis AC tidak menerima booking.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-xl font-bold">Tambah tanggal libur</h2>

          <form onSubmit={tambahTanggalLibur} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="tanggal"
                className="mb-2 block text-sm font-medium"
              >
                Tanggal libur
              </label>
              <input
                id="tanggal"
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="keterangan"
                className="mb-2 block text-sm font-medium"
              >
                Keterangan
              </label>
              <input
                id="keterangan"
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Contoh: Libur Lebaran"
                maxLength={120}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            {message && (
              <p
                role="status"
                className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || loading}
              className="w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {saving ? "Menyimpan..." : "Tambah tanggal libur"}
            </button>
          </form>
        </section>

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Daftar tanggal libur</h2>
              <p className="mt-1 text-sm text-slate-500">
                {holidays.length} tanggal terdaftar
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadHolidays()}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              Muat ulang
            </button>
          </div>

          {loading ? (
            <p className="py-8 text-center text-slate-500">
              Memuat tanggal libur...
            </p>
          ) : holidays.length === 0 ? (
            <p className="py-8 text-center text-slate-500">
              Belum ada tanggal libur. Tambahkan lewat formulir di atas.
            </p>
          ) : (
            <div className="mt-5 divide-y divide-slate-100">
              {holidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-semibold">
                      {formatTanggal(holiday.tanggal)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {holiday.keterangan}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void hapusTanggalLibur(holiday)}
                    disabled={deletingId === holiday.id}
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === holiday.id ? "Menghapus..." : "Hapus"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
