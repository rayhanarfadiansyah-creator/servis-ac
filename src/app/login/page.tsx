
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      const { data: loginData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        setError(
          loginError.message === "Invalid login credentials"
            ? "Email atau password salah. Periksa kembali atau daftar akun baru."
            : loginError.message
        );
        return;
      }

      const user = loginData.user;

      if (!user) {
        setError("Data akun tidak ditemukan. Silakan coba login kembali.");
        return;
      }

      const { data: admin, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminError) {
        await supabase.auth.signOut();
        setError(
          "Gagal memeriksa akses akun admin. Periksa tabel admin_users dan pengaturan RLS Supabase."
        );
        return;
      }

      const next = searchParams.get("next");

      // Hanya izinkan redirect ke halaman internal website.
      const tujuanValid =
        next && next.startsWith("/") && !next.startsWith("//")
          ? next
          : null;

      if (admin) {
        // Admin tetap masuk dashboard atau halaman admin yang dituju.
        if (tujuanValid?.startsWith("/admin")) {
          router.replace(tujuanValid);
        } else {
          router.replace("/admin");
        }
      } else {
        // User biasa masuk beranda, kecuali ada tujuan khusus
        // seperti /booking.
        const tujuanUser =
          tujuanValid && !tujuanValid.startsWith("/admin")
            ? tujuanValid
            : "/";

        router.replace(tujuanUser);
      }

      router.refresh();
    } catch {
      setError(
        "Terjadi kesalahan. Periksa koneksi dan konfigurasi Supabase."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <Link
          href="/"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          ← Kembali ke Beranda
        </Link>

        <div className="mb-7 mt-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700 text-2xl text-white">
            ❄
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Login
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Masuk untuk melakukan booking servis AC atau mengelola pesanan.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-700 px-4 py-3 font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Sedang masuk..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="font-bold text-blue-700 hover:underline"
          >
            Daftar sekarang
          </Link>
        </p>
      </div>
    </main>
  );
}
