
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
  created_at: string;
};

async function compressProductImage(file: File): Promise<File> {
  const image = new Image();
  const objectUrl = URL.createObjectURL(file);

  try {
    image.src = objectUrl;

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Foto tidak bisa dibaca."));
    });

    const maxDimension = 900;
    const scale = Math.min(
      1,
      maxDimension / Math.max(image.naturalWidth, image.naturalHeight)
    );

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Browser tidak mendukung kompresi foto.");
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", 0.78);
    });

    if (!blob) {
      throw new Error("Gagal mengompres foto.");
    }

    if (blob.type !== "image/webp") {
      throw new Error(
        "Browser tidak mendukung format WebP. Coba gunakan Chrome atau Edge terbaru."
      );
    }

    return new File(
      [blob],
      `${file.name.replace(/\.[^.]+$/, "")}.webp`,
      {
        type: "image/webp",
        lastModified: Date.now(),
      }
    );
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

const initialForm = {
  nama: "",
  merek: "",
  tipe: "",
  pk: "",
  harga: "",
  stok: "0",
  deskripsi: "",
  status: "published",
};

export default function KelolaProdukPage() {
  const [supabase] = useState(() => createClient());
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [foto, setFoto] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadProducts() {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, nama, merek, tipe, pk, harga, stok, deskripsi, foto_url, status, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage("Gagal memuat produk: " + error.message);
      } else {
        setProducts((data ?? []) as Product[]);
        setErrorMessage("");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat memuat produk.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setErrorMessage("");

    let uploadedPath: string | null = null;

    try {
      // Pastikan sesi login masih valid.
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Sesi login tidak valid. Silakan login ulang.");
      }

      // Pastikan akun ini terdaftar sebagai admin.
      const { data: admin, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminError) {
        throw new Error(
          "Gagal memeriksa akses admin: " + adminError.message
        );
      }

      if (!admin) {
        throw new Error(
          "Akun ini tidak terdaftar sebagai admin. Periksa UID di admin_users."
        );
      }

      const harga = Number(form.harga);
      const stok = Number(form.stok);

      if (!form.nama.trim() || !form.merek.trim()) {
        throw new Error("Nama produk dan merek wajib diisi.");
      }

      if (!Number.isFinite(harga) || harga < 0) {
        throw new Error("Harga harus berupa angka nol atau lebih.");
      }

      if (!Number.isInteger(stok) || stok < 0) {
        throw new Error("Stok harus berupa bilangan bulat nol atau lebih.");
      }

      let fotoUrl: string | null = null;

      // Kompres foto sebelum upload.
      if (foto) {
        if (!foto.type.startsWith("image/")) {
          throw new Error("File harus berupa gambar.");
        }

        if (foto.size > 5 * 1024 * 1024) {
          throw new Error("Ukuran foto asli maksimal 5 MB.");
        }

        const compressedFoto = await compressProductImage(foto);

        if (compressedFoto.size > 2 * 1024 * 1024) {
          throw new Error(
            "Foto masih terlalu besar setelah dikompres. Coba pilih foto lain."
          );
        }

        const path = `${user.id}/${crypto.randomUUID()}.webp`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, compressedFoto, {
            cacheControl: "31536000",
            upsert: false,
            contentType: "image/webp",
          });

        if (uploadError) {
          throw new Error("Upload foto gagal: " + uploadError.message);
        }

        uploadedPath = path;

        const { data } = supabase.storage
          .from("product-images")
          .getPublicUrl(path);

        fotoUrl = data.publicUrl;
      }

      // Simpan data produk.
      const { error: insertError } = await supabase
        .from("products")
        .insert({
          nama: form.nama.trim(),
          merek: form.merek.trim(),
          tipe: form.tipe.trim() || null,
          pk: form.pk.trim() || null,
          harga,
          stok,
          deskripsi: form.deskripsi.trim() || null,
          foto_url: fotoUrl,
          status: form.status,
        });

      if (insertError) {
        throw new Error("Simpan produk gagal: " + insertError.message);
      }

      // Produk berhasil disimpan.
      uploadedPath = null;
      setMessage("Produk berhasil ditambahkan!");
      setForm(initialForm);
      setFoto(null);
      setShowForm(false);

      await loadProducts();
    } catch (error) {
      // Bersihkan foto jika upload berhasil tetapi penyimpanan gagal.
      if (uploadedPath) {
        const { error: cleanupError } = await supabase.storage
          .from("product-images")
          .remove([uploadedPath]);

        if (cleanupError) {
          console.error("Gagal membersihkan foto:", cleanupError.message);
        }
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan yang tidak diketahui."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Yakin ingin menghapus ${product.nama}?`)) {
      return;
    }

    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {
      setErrorMessage("Gagal menghapus produk: " + error.message);
      return;
    }

    setMessage("Produk berhasil dihapus.");
    await loadProducts();
  }

  function rupiah(value: number) {
    return Number(value).toLocaleString("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    });
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 text-gray-900 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <a
          href="/admin"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Kembali ke Dashboard
        </a>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Kelola Produk</h1>
            <p className="mt-1 text-gray-600">
              Tambah dan kelola produk AC.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm((value) => !value);
              setMessage("");
              setErrorMessage("");
            }}
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            {showForm ? "Tutup Form" : "+ Tambah Produk"}
          </button>
        </div>

        {message && (
          <p className="mt-4 rounded-lg bg-green-100 p-4 text-green-800">
            {message}
          </p>
        )}

        {errorMessage && (
          <p className="mt-4 break-words rounded-lg bg-red-100 p-4 text-red-800">
            {errorMessage}
          </p>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5 rounded-xl bg-white p-5 shadow-sm"
          >
            <h2 className="text-xl font-bold">Tambah Produk Baru</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Nama produk *
                <input
                  name="nama"
                  value={form.nama}
                  onChange={(e) =>
                    setForm({ ...form, nama: e.target.value })
                  }
                  required
                  maxLength={150}
                  className="mt-1 w-full rounded-lg border p-3 font-normal"
                  placeholder="AC Split 1 PK"
                />
              </label>

              <label className="text-sm font-medium">
                Merek *
                <input
                  name="merek"
                  value={form.merek}
                  onChange={(e) =>
                    setForm({ ...form, merek: e.target.value })
                  }
                  required
                  maxLength={100}
                  className="mt-1 w-full rounded-lg border p-3 font-normal"
                  placeholder="Daikin"
                />
              </label>

              <label className="text-sm font-medium">
                Tipe AC
                <input
                  name="tipe"
                  value={form.tipe}
                  onChange={(e) =>
                    setForm({ ...form, tipe: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border p-3 font-normal"
                  placeholder="Split Inverter"
                />
              </label>

              <label className="text-sm font-medium">
                Kapasitas PK
                <input
                  name="pk"
                  value={form.pk}
                  onChange={(e) =>
                    setForm({ ...form, pk: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border p-3 font-normal"
                  placeholder="1 PK"
                />
              </label>

              <label className="text-sm font-medium">
                Harga (Rp) *
                <input
                  name="harga"
                  type="number"
                  min="0"
                  step="1"
                  value={form.harga}
                  onChange={(e) =>
                    setForm({ ...form, harga: e.target.value })
                  }
                  required
                  className="mt-1 w-full rounded-lg border p-3 font-normal"
                  placeholder="3500000"
                />
              </label>

              <label className="text-sm font-medium">
                Stok *
                <input
                  name="stok"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stok}
                  onChange={(e) =>
                    setForm({ ...form, stok: e.target.value })
                  }
                  required
                  className="mt-1 w-full rounded-lg border p-3 font-normal"
                />
              </label>

              <label className="text-sm font-medium sm:col-span-2">
                Deskripsi
                <textarea
                  name="deskripsi"
                  value={form.deskripsi}
                  onChange={(e) =>
                    setForm({ ...form, deskripsi: e.target.value })
                  }
                  rows={3}
                  className="mt-1 w-full rounded-lg border p-3 font-normal"
                  placeholder="Deskripsi produk..."
                />
              </label>

              <label className="text-sm font-medium">
                Status
                <select
                  name="status"
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border bg-white p-3 font-normal"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>

              <label className="text-sm font-medium">
                Foto produk
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setFoto(e.target.files?.[0] ?? null)
                  }
                  className="mt-1 block w-full rounded-lg border p-2 font-normal"
                />
                <span className="mt-1 block text-xs text-gray-500">
                  Format gambar, maksimal 5 MB. Foto akan dikompres otomatis.
                </span>
              </label>
            </div>

            {foto && (
              <p className="text-sm text-gray-600">
                Foto dipilih: {foto.name} (
                {(foto.size / 1024).toFixed(0)} KB)
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan Produk"}
            </button>
          </form>
        )}

        <section className="mt-6 overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b p-4">
            <h2 className="text-lg font-bold">Daftar Produk</h2>
            <p className="text-sm text-gray-500">
              Total {products.length} produk
            </p>
          </div>

          {loading ? (
            <p className="p-6 text-center">Memuat produk...</p>
          ) : products.length === 0 ? (
            <p className="p-6 text-center text-gray-500">
              Belum ada produk. Klik Tambah Produk untuk memulai.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3">Foto</th>
                    <th className="p-3">Nama Produk</th>
                    <th className="p-3">Merek</th>
                    <th className="p-3">Tipe / PK</th>
                    <th className="p-3">Harga</th>
                    <th className="p-3">Stok</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-t">
                      <td className="p-3">
                        {product.foto_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.foto_url}
                            alt={product.nama}
                            width={56}
                            height={56}
                            loading="lazy"
                            decoding="async"
                            className="h-14 w-14 rounded-lg border object-cover"
                          />
                        ) : (
                          <span className="text-gray-400">No foto</span>
                        )}
                      </td>
                      <td className="p-3 font-medium">{product.nama}</td>
                      <td className="p-3">{product.merek}</td>
                      <td className="p-3">
                        {[product.tipe, product.pk]
                          .filter(Boolean)
                          .join(" / ") || "-"}
                      </td>
                      <td className="p-3">{rupiah(product.harga)}</td>
                      <td className="p-3">{product.stok}</td>
                      <td className="p-3">{product.status}</td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => void deleteProduct(product)}
                          className="rounded-md bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
