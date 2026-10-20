
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function AuthNav() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let aktif = true;

    async function cekSesi() {
      const { data, error } = await supabase.auth.getSession();

      if (aktif) {
        setUser(error ? null : data.session?.user ?? null);
        setLoading(false);
      }
    }

    void cekSesi();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (aktif) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      aktif = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        alert("Gagal logout. Silakan coba lagi.");
        return;
      }

      setUser(null);
      router.replace("/");
      router.refresh();
    } catch {
      alert("Terjadi kesalahan saat logout.");
    } finally {
      setLoggingOut(false);
    }
  }

  const bookingHref = user
    ? "/booking"
    : "/login?next=%2Fbooking";

  return (
    <div className="flex min-w-0 max-w-full flex-wrap items-center justify-end gap-2">
      {!loading && !user && (
        <>
          <Link
            href="/login"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-700 px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-100 px-3 py-2 text-sm font-bold text-blue-800 hover:bg-blue-200"
          >
            Daftar
          </Link>
        </>
      )}

      {!loading && user && (
        <>
          <Link
            href="/profile"
            className="inline-flex min-h-10 min-w-0 max-w-[140px] items-center justify-center overflow-hidden rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 sm:max-w-40"
            title={user.email ?? "Profil"}
          >
            <span className="truncate">
              {user.email ?? "Profil"}
            </span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            {loggingOut ? "Keluar..." : "Logout"}
          </button>
        </>
      )}

      {loading && (
        <span className="px-2 py-2 text-xs text-slate-500 sm:text-sm">
          Memeriksa akun...
        </span>
      )}

      <Link
        href={bookingHref}
        className="inline-flex min-h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800 sm:px-4 sm:text-sm"
      >
        Booking Servis
      </Link>
    </div>
  );
}
