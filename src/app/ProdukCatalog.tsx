
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type Product = {
  id: string;
  nama: string;
  merek: string;
  tipe: string | null;
  pk: string | null;
  harga: number;
  stok: number;
  deskripsi: string | null;
  foto_url: string | null;
  status: string;
};

export default function ProdukCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("products")
        .select(
          "id, nama, merek, tipe, pk, harga, stok, deskripsi, foto_url, status"
        )
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setProducts((data ?? []) as Product[]);
      }

      setLoading(false);
    }

    void loadProducts();
  }, []);

  const formatHarga = (harga: number) =>
    Number(harga).toLocaleString("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    });

  return (
    <div className="mt-10">
      {loading && (
        <p className="py-8 text-center text-slate-500">
          Memuat produk AC...
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 p-4 text-red-700">
          Produk gagal dimuat: {error}
        </p>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          Belum ada produk AC yang tersedia. Silakan hubungi kami untuk
          informasi produk.
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <article
            key={product.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex h-56 items-center justify-center bg-slate-100">
              {product.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.foto_url}
                  alt={product.nama}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-slate-400">Foto belum tersedia</span>
              )}
            </div>

            <div className="p-5">
              <p className="text-sm font-semibold text-blue-700">
                {product.merek}
              </p>

              <h3 className="mt-1 text-xl font-bold text-slate-900">
                {product.nama}
              </h3>

              {(product.tipe || product.pk) && (
                <p className="mt-2 text-sm text-slate-500">
                  {[product.tipe, product.pk].filter(Boolean).join(" • ")}
                </p>
              )}

              {product.deskripsi && (
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                  {product.deskripsi}
                </p>
              )}

              <p className="mt-4 text-xl font-bold text-slate-900">
                {formatHarga(product.harga)}
              </p>

              <p className="mt-2 text-sm text-slate-600">
                {product.stok > 0
                  ? `Stok tersedia: ${product.stok}`
                  : "Stok habis"}
              </p>

              <a
                href={`https://wa.me/6285945964557?text=${encodeURIComponent(
                  `Halo, saya ingin bertanya tentang ${product.nama} merek ${product.merek}.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="mt-5 block rounded-lg bg-green-600 px-4 py-3 text-center font-bold text-white hover:bg-green-700"
              >
                Tanya Produk
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
