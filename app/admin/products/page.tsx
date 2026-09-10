"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

const ADMIN_EMAIL = "maspri2904@gmail.com";
const money = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

type Product = { id: string; name: string; description: string | null; price: number; category: string; image_url: string | null; stock: number; is_available: boolean };

type Form = { name: string; description: string; price: string; category: string; image_url: string; stock: string; is_available: boolean };
const empty: Form = { name: "", description: "", price: "", category: "Makanan", image_url: "", stock: "0", is_available: true };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<Form>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true); setError("");
    const { data: user } = await supabase.auth.getUser();
    if (!user.user || user.user.email?.toLowerCase() !== ADMIN_EMAIL) { location.href = "/admin/login"; return; }
    const { data, error } = await supabase.from("products").select("id,name,description,price,category,image_url,stock,is_available").order("created_at", { ascending: false });
    if (error) setError(error.message); else setProducts((data || []) as Product[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function edit(p: Product) {
    setEditing(p.id);
    setForm({ name: p.name, description: p.description || "", price: String(p.price), category: p.category, image_url: p.image_url || "", stock: String(p.stock), is_available: p.is_available });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() { setEditing(null); setForm(empty); }

  async function save(e: FormEvent) {
    e.preventDefault(); setSaving(true); setError(""); setMessage("");
    const price = Number(form.price); const stock = Number(form.stock);
    if (!form.name.trim() || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) { setError("Nama, harga, dan stok harus diisi dengan benar."); setSaving(false); return; }
    const payload = { name: form.name.trim(), description: form.description.trim() || null, price, category: form.category.trim() || "Makanan", image_url: form.image_url.trim() || null, stock, is_available: form.is_available };
    const result = editing ? await supabase.from("products").update(payload).eq("id", editing) : await supabase.from("products").insert(payload);
    if (result.error) setError(result.error.message); else { setMessage(editing ? "Produk berhasil diperbarui." : "Produk berhasil ditambahkan."); reset(); await load(); }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("Hapus produk ini? Jika sudah pernah dipakai dalam pesanan, lebih aman nonaktifkan saja.")) return;
    setError(""); const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) setError(error.message); else { setMessage("Produk dihapus."); await load(); }
  }

  async function toggle(p: Product) {
    setError(""); const { error } = await supabase.from("products").update({ is_available: !p.is_available }).eq("id", p.id);
    if (error) setError(error.message); else await load();
  }

  async function logout() { await supabase.auth.signOut(); location.href = "/admin/login"; }

  return <main className="min-h-screen bg-zinc-950 text-white"><div className="mx-auto max-w-6xl p-5 md:p-8">
    <header className="mb-6 flex items-center justify-between gap-3"><div><button onClick={() => location.href = "/admin"} className="text-sm text-zinc-500">← Dashboard</button><h1 className="mt-2 text-2xl font-bold">Manajemen Produk</h1><p className="text-sm text-zinc-500">Tambah, edit, stok, harga, dan ketersediaan menu.</p></div><button onClick={logout} className="rounded-xl bg-zinc-800 px-4 py-2 text-sm">Keluar</button></header>
    {error && <p className="mb-4 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">{error}</p>}{message && <p className="mb-4 rounded-xl border border-emerald-900 bg-emerald-950/30 p-3 text-sm text-emerald-400">{message}</p>}
    <form onSubmit={save} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><div className="mb-5 flex items-center justify-between"><h2 className="font-semibold">{editing ? "Edit Produk" : "Tambah Produk"}</h2>{editing && <button type="button" onClick={reset} className="text-sm text-zinc-500">Batal edit</button>}</div><div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm">Nama<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3" placeholder="Contoh: Nasi Ayam Bakar" /></label>
      <label className="text-sm">Kategori<input required value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3" /></label>
      <label className="text-sm">Harga<input required type="number" min="0" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3" placeholder="22000" /></label>
      <label className="text-sm">Stok<input required type="number" min="0" step="1" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3" /></label>
      <label className="text-sm md:col-span-2">URL Foto<input type="url" value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3" placeholder="https://..." /></label>
      <label className="text-sm md:col-span-2">Deskripsi<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3" placeholder="Deskripsi menu" /></label>
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.is_available} onChange={e=>setForm({...form,is_available:e.target.checked})} className="h-5 w-5" /> Tampilkan di menu pelanggan</label>
    </div><button disabled={saving} className="mt-5 w-full rounded-xl bg-emerald-500 py-3 font-semibold text-zinc-950 disabled:opacity-50">{saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Produk"}</button></form>
    <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><div className="mb-5 flex justify-between"><h2 className="font-semibold">Daftar Produk</h2><span className="text-sm text-zinc-500">{products.length} produk</span></div>{loading ? <p className="py-10 text-center text-zinc-500">Memuat...</p> : <div className="space-y-3">{products.map(p=><article key={p.id} className="rounded-xl border border-zinc-800 p-4"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><div className="flex items-center gap-2"><h3 className="font-semibold">{p.name}</h3><span className={`rounded-full px-2 py-1 text-xs ${p.is_available ? "bg-emerald-950 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}>{p.is_available ? "Aktif" : "Nonaktif"}</span></div><p className="mt-1 text-sm text-zinc-500">{p.category} · {money(p.price)} · Stok {p.stock}</p>{p.description && <p className="mt-1 text-xs text-zinc-600">{p.description}</p>}</div><div className="flex flex-wrap gap-2"><button onClick={()=>toggle(p)} className="rounded-lg border border-zinc-700 px-3 py-2 text-sm">{p.is_available ? "Nonaktifkan" : "Aktifkan"}</button><button onClick={()=>edit(p)} className="rounded-lg border border-zinc-700 px-3 py-2 text-sm">Edit</button><button onClick={()=>remove(p.id)} className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-400">Hapus</button></div></div></article>)}</div>}</section>
  </div></main>;
}
