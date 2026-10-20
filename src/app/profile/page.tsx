
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Booking = {
  id: string;
  layanan: string;
  tanggal: string;
  jumlah_unit: number;
  status: string;
  created_at: string;
};

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [pesan, setPesan] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    async function loadProfile() {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace("/login?next=/profile");
        return;
      }

      setNama(data.user.user_metadata?.full_name ?? "");
      setEmail(data.user.email ?? "");

      const { data: history, error: historyError } = await supabase
        .from("bookings")
        .select("id, layanan, tanggal, jumlah_unit, status, created_at")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false });

      if (historyError) {
        setPesan(
          "Riwayat belum bisa dimuat. Pastikan tabel bookings sudah dibuat di Supabase."
        );
      } else {
        setBookings((history ?? []) as Booking[]);
      }

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function simpanNama(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setPesan("");

    const { error } = await supabase.auth.updateUser({
      data: { full_name: nama.trim() },
    });

    setSaving(false);

    if (error) {
      setPesan("Nama gagal disimpan: " + error.message);
      return;
    }

    setPesan("Nama profile berhasil diperbarui.");
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <p className="text-slate-600">Memuat profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-6 inline-block font-semibold text-blue-700 hover:underline"
        >
          ← Kembali ke Beranda
        </Link>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
              {nama.trim().charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="text-2xl font-bold">Profile Saya</h1>
              <p className="text-sm text-slate-500">
                Kelola informasi akun lu
              </p>
            </div>
          </div>

          <form onSubmit={simpanNama} className="space-y-4">
            <div>
              <label htmlFor="nama" className="mb-1 block font-medium">
                Nama lengkap
              </label>
              <input
                id="nama"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
                maxLength={100}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block font-medium">
                Email
              </label>
              <input
                id="email"
                value={email}
                readOnly
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Email akun ditampilkan saja dan tidak bisa diedit di sini.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </form>

          {pesan && (
            <p
              role="status"
              className="mt-4 rounded-lg bg-slate-100 p-3 text-sm"
            >
              {pesan}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-6">
            <Link
              href="/booking"
              className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
            >
              Booking Servis AC
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-red-200 px-5 py-3 font-semibold text-red-700 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold">Riwayat Booking</h2>
            <p className="mt-1 text-sm text-slate-500">
              Daftar booking yang tersimpan pada akun lu.
            </p>
          </div>

          {bookings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
              <p className="font-medium">Belum ada riwayat booking.</p>
              <p className="mt-2 text-sm text-slate-500">
                Booking yang hanya dikirim ke WhatsApp belum otomatis masuk ke
                riwayat. Data akan muncul setelah disimpan ke database.
              </p>
              <Link
                href="/booking"
                className="mt-4 inline-block font-semibold text-blue-700 hover:underline"
              >
                Buat booking pertama →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold">{booking.layanan}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Tanggal:{" "}
                        {booking.tanggal
                          ? new Date(
                              `${booking.tanggal}T00:00:00`
                            ).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "Belum ditentukan"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Jumlah unit: {booking.jumlah_unit}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                      {booking.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
