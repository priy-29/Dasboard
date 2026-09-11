"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  async function load() {
    setLoading(true); setError("");
    const { data: user } = await supabase.auth.getUser();
    if (!user.user || user.user.email?.toLowerCase() !== ADMIN_EMAIL) { location.href = "/admin/login"; return; }
    const { data, error } = await supabase.from("products").select("id,name,description,price,category,image_url,stock,is_available").order("created_at", { ascending: false });
    if (error) setError(error.message); else setProducts((data || []) as Product[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const categories = useMemo(() => ["Semua", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))], [products]);
  const filtered = useMemo(() => products.filter(p => (!query.trim() || `${p.name} ${p.description || ""} ${p.category}`.toLowerCase().includes(query.toLowerCase())) && (category === "Semua" || p.category === category)), [products, query, category]);
  const active = products.filter(p => p.is_available).length;
  const lowStock = products.filter(p => p.stock <= 3).length;

  function edit(p: Product) { setEditing(p.id); setForm({ name: p.name, description: p.description || "", price: String(p.price), category: p.category, image_url: p.image_url || "", stock: String(p.stock), is_available: p.is_available }); window.scrollTo({ top: 0, behavior: "smooth" }); }
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

  async function remove() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id); setError("");
    const { error } = await supabase.from("products").delete().eq("id", deleteTarget.id);
    if (error) setError(error.message); else { setMessage("Produk berhasil dihapus."); setDeleteTarget(null); await load(); }
    setBusyId(null);
  }
  async function toggle(p: Product) {
    setBusyId(p.id); setError("");
    const { error } = await supabase.from("products").update({ is_available: !p.is_available }).eq("id", p.id);
    if (error) setError(error.message); else { setMessage(`${p.name} ${p.is_available ? "dinonaktifkan" : "diaktifkan"}.`); await load(); }
    setBusyId(null);
  }
  async function logout() { await supabase.auth.signOut(); location.href = "/admin/login"; }

  return <main className="min-h-screen bg-zinc-950 text-white"><div className="mx-auto max-w-6xl p-4 md:p-8">
    <header className="mb-6 flex items-start justify-between gap-3"><div><button onClick={() => location.href = "/admin"} className="text-sm text-zinc-500 hover:text-zinc-300">← Dashboard</button><h1 className="mt-2 text-3xl font-black tracking-tight">Produk</h1><p className="mt-1 text-sm text-zinc-500">Kelola menu, harga, stok, foto, dan ketersediaan.</p></div><button onClick={logout} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-semibold">Keluar</button></header>
    {(error || message) && <div className={`mb-5 rounded-2xl border p-4 text-sm ${error ? "border-red-900/70 bg-red-950/30 text-red-300" : "border-emerald-900/70 bg-emerald-950/30 text-emerald-300"}`}>{error || message}</div>}
    <div className="mb-5 grid grid-cols-3 gap-3"><div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4"><p className="text-xs text-zinc-500">Total produk</p><p className="mt-1 text-2xl font-black">{products.length}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4"><p className="text-xs text-zinc-500">Aktif</p><p className="mt-1 text-2xl font-black text-emerald-400">{active}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4"><p className="text-xs text-zinc-500">Stok ≤ 3</p><p className="mt-1 text-2xl font-black text-orange-400">{lowStock}</p></div></div>
    <form onSubmit={save} className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-xl"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold">{editing ? "Edit produk" : "Tambah produk"}</h2><p className="mt-1 text-xs text-zinc-500">Perubahan langsung tersimpan ke menu pelanggan.</p></div>{editing && <button type="button" onClick={reset} className="rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-400">Batal</button>}</div><div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm">Nama<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-emerald-500" placeholder="Nasi Ayam Bakar" /></label>
      <label className="text-sm">Kategori<input required value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-emerald-500" placeholder="Makanan" /></label>
      <label className="text-sm">Harga<input required type="number" min="0" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-emerald-500" /></label>
      <label className="text-sm">Stok<input required type="number" min="0" step="1" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-emerald-500" /></label>
      <label className="text-sm md:col-span-2">URL Foto<input type="url" value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-emerald-500" placeholder="https://..." /></label>
      <label className="text-sm md:col-span-2">Deskripsi<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-emerald-500" placeholder="Deskripsi menu" /></label>
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.is_available} onChange={e=>setForm({...form,is_available:e.target.checked})} className="h-5 w-5 accent-emerald-500" /> Tampilkan di menu pelanggan</label>
    </div><button disabled={saving} className="mt-5 w-full rounded-xl bg-emerald-500 py-3 font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-50">{saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Produk"}</button></form>
    <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5"><div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="font-bold">Daftar menu</h2><p className="text-xs text-zinc-500">{filtered.length} dari {products.length} produk</p></div><div className="flex flex-col gap-2 sm:flex-row"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari produk..." className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"/><select value={category} onChange={e=>setCategory(e.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none">{categories.map(c=><option key={c}>{c}</option>)}</select></div></div>
      {loading ? <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-800/60" />)}</div> : filtered.length===0 ? <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center"><p className="text-2xl">🍽️</p><p className="mt-2 font-semibold">Produk tidak ditemukan</p><p className="mt-1 text-sm text-zinc-500">Coba ubah kata pencarian atau filter kategori.</p></div> : <div className="space-y-3">{filtered.map(p=><article key={p.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-3"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-900">{p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-2xl">🍽️</div>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{p.name}</h3><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${p.is_available ? "bg-emerald-950 text-emerald-300" : "bg-zinc-800 text-zinc-500"}`}>{p.is_available ? "AKTIF" : "NONAKTIF"}</span></div><p className="mt-1 text-sm text-zinc-400">{p.category} · {money(p.price)}</p><p className={`mt-1 text-xs ${p.stock<=3?"text-orange-400":"text-zinc-500"}`}>Stok {p.stock}{p.stock<=3?" · perlu dicek":""}</p></div><div className="grid grid-cols-3 gap-2 sm:w-auto"><button disabled={busyId===p.id} onClick={()=>void toggle(p)} className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-semibold">{busyId===p.id?"...":p.is_available?"Matikan":"Aktifkan"}</button><button onClick={()=>edit(p)} className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-semibold">Edit</button><button onClick={()=>setDeleteTarget(p)} className="rounded-xl border border-red-900/70 bg-red-950/30 px-3 py-2 text-xs font-semibold text-red-300">Hapus</button></div></div></article>)}</div>}
    </section>
  </div>
  {deleteTarget && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"><div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"><div className="text-3xl">🗑️</div><h2 className="mt-3 text-xl font-black">Hapus produk?</h2><p className="mt-2 text-sm text-zinc-400">Kamu akan menghapus <b className="text-white">{deleteTarget.name}</b>. Jika produk sudah pernah dipakai dalam pesanan, lebih aman menonaktifkannya.</p><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={()=>setDeleteTarget(null)} className="rounded-xl border border-zinc-700 py-3 font-semibold">Batal</button><button disabled={busyId===deleteTarget.id} onClick={()=>void remove()} className="rounded-xl bg-red-500 py-3 font-bold text-white disabled:opacity-50">{busyId===deleteTarget.id?"Menghapus...":"Ya, Hapus"}</button></div></div></div>}
  </main>;
}
