"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

type Product = { id: string; name: string; category: string; price: number; description: string | null; stock: number; is_available: boolean };
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
const rupiah = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export default function MenuPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("Semua");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { (async () => { const { data, error } = await supabase.from("products").select("id,name,category,price,description,stock,is_available").eq("is_available", true).order("created_at"); if (error) setError(error.message); else setProducts((data || []) as Product[]); setLoading(false); })(); }, []);
  const categories = ["Semua", ...Array.from(new Set(products.map(p => p.category)))];
  const visible = products.filter(p => category === "Semua" || p.category === category);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = useMemo(() => products.reduce((sum, p) => sum + p.price * (cart[p.id] || 0), 0), [cart, products]);
  function add(id: string) { setCart(c => ({ ...c, [id]: Math.min((c[id] || 0) + 1, products.find(p => p.id === id)?.stock || 1) })); }
  function remove(id: string) { setCart(c => { const n = { ...c }; if ((n[id] || 0) <= 1) delete n[id]; else n[id]--; return n; }); }
  function checkout() { if (count) { sessionStorage.setItem("dasboard_cart", JSON.stringify(cart)); router.push("/menu/checkout"); } }

  return <main className="min-h-screen bg-zinc-950 pb-28 text-white">
    <header className="border-b border-zinc-800 bg-zinc-900/80"><div className="mx-auto max-w-5xl px-5 py-5"><p className="text-sm text-emerald-400">Selamat datang 👋</p><h1 className="mt-1 text-2xl font-bold">Rumah Makan Kita</h1><p className="mt-1 text-sm text-zinc-500">Pesan makanan favoritmu dengan mudah.</p></div></header>
    <div className="mx-auto max-w-5xl px-5"><div className="sticky top-0 z-10 -mx-5 overflow-x-auto bg-zinc-950/95 px-5 py-4 backdrop-blur"><div className="flex gap-2">{categories.map(c => <button key={c} onClick={() => setCategory(c)} className={`rounded-full px-4 py-2 text-sm ${category === c ? "bg-emerald-500 font-semibold text-zinc-950" : "bg-zinc-900 text-zinc-400"}`}>{c}</button>)}</div></div>
      {loading ? <p className="py-12 text-center text-zinc-500">Memuat menu...</p> : error ? <p className="py-12 text-center text-red-400">Gagal memuat menu: {error}</p> : <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visible.map(p => <article key={p.id} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"><div className="flex h-36 items-center justify-center bg-zinc-800 text-6xl">🍽️</div><div className="p-4"><p className="text-xs text-emerald-400">{p.category}</p><h2 className="mt-1 font-semibold">{p.name}</h2><p className="mt-1 text-xs leading-5 text-zinc-500">{p.description || "Menu pilihan rumah makan."}</p><div className="mt-4 flex items-center justify-between"><span className="font-bold">{rupiah(p.price)}</span>{cart[p.id] ? <div className="flex items-center gap-3 rounded-full bg-zinc-800 px-2 py-1"><button onClick={() => remove(p.id)} className="h-7 w-7 rounded-full bg-zinc-700">−</button><span className="text-sm">{cart[p.id]}</span><button onClick={() => add(p.id)} className="h-7 w-7 rounded-full bg-emerald-500 text-zinc-950">+</button></div> : <button onClick={() => add(p.id)} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950">Tambah</button>}</div></div></article>)}</section>}
    </div>
    {count > 0 && <button onClick={() => setShowCart(true)} className="fixed bottom-5 left-1/2 flex w-[calc(100%-40px)] max-w-5xl -translate-x-1/2 items-center justify-between rounded-2xl bg-emerald-500 px-5 py-4 font-semibold text-zinc-950 shadow-2xl"><span>{count} item di keranjang</span><span>{rupiah(total)} →</span></button>}
    {showCart && <div className="fixed inset-0 z-30 bg-black/70 p-5"><div className="mx-auto mt-12 max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-5"><div className="flex justify-between"><h2 className="text-xl font-bold">Keranjang</h2><button onClick={() => setShowCart(false)} className="text-zinc-500">✕</button></div><div className="mt-5 space-y-3">{products.filter(p => cart[p.id]).map(p => <div key={p.id} className="flex items-center justify-between rounded-xl bg-zinc-800 p-3"><div><p className="font-medium">{p.name}</p><p className="text-sm text-zinc-500">{rupiah(p.price)} × {cart[p.id]}</p></div><div className="flex gap-2"><button onClick={() => remove(p.id)} className="rounded-lg bg-zinc-700 px-3">−</button><button onClick={() => add(p.id)} className="rounded-lg bg-emerald-500 px-3 text-zinc-950">+</button></div></div>)}</div><div className="mt-5 border-t border-zinc-800 pt-4"><div className="flex justify-between text-lg font-bold"><span>Total</span><span>{rupiah(total)}</span></div><button onClick={checkout} className="mt-4 w-full rounded-xl bg-emerald-500 py-3 font-semibold text-zinc-950">Lanjut Checkout</button></div></div></div>}
  </main>;
}
