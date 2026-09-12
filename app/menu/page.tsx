"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { ShoppingCart, ArrowRight, X } from "lucide-react";

type Product = { id: string; name: string; category: string; price: number; description: string | null; stock: number; is_available: boolean; image_url: string | null };
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
const rupiah = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export default function MenuPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("Semua");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showCart, setShowCart] = useState(false);
  const [preview, setPreview] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { (async () => { const { data, error } = await supabase.from("products").select("id,name,category,price,description,stock,is_available,image_url").eq("is_available", true).order("created_at"); if (error) setError(error.message); else setProducts((data || []) as Product[]); setLoading(false); })(); }, []);
  const categories = ["Semua", ...Array.from(new Set(products.map(p => p.category)))];
  const visible = products.filter(p => category === "Semua" || p.category === category);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = useMemo(() => products.reduce((sum, p) => sum + p.price * (cart[p.id] || 0), 0), [cart, products]);
  function add(id: string) { setCart(c => ({ ...c, [id]: Math.min((c[id] || 0) + 1, products.find(p => p.id === id)?.stock || 1) })); }
  function remove(id: string) { setCart(c => { const n = { ...c }; if ((n[id] || 0) <= 1) delete n[id]; else n[id]--; return n; }); }
  function checkout() { if (count) { sessionStorage.setItem("dasboard_cart", JSON.stringify(cart)); router.push("/menu/checkout"); } }

  return <main className="min-h-screen bg-zinc-950 pb-36 text-white">
    <header className="border-b border-zinc-800 bg-zinc-900/80"><div className="mx-auto max-w-5xl px-5 py-5"><p className="text-sm text-emerald-400">Selamat datang 👋</p><h1 className="mt-1 text-2xl font-bold">Rumah Makan Kita</h1><p className="mt-1 text-sm text-zinc-500">Pesan makanan favoritmu dengan mudah.</p></div></header>
    <div className="mx-auto max-w-5xl px-5"><div className="sticky top-0 z-10 -mx-5 overflow-x-auto bg-zinc-950/95 px-5 py-4 backdrop-blur"><div className="flex gap-2">{categories.map(c => <button key={c} onClick={() => setCategory(c)} className={`rounded-full px-4 py-2 text-sm ${category === c ? "bg-emerald-500 font-semibold text-zinc-950" : "bg-zinc-900 text-zinc-400"}`}>{c}</button>)}</div></div>
      {loading ? <p className="py-12 text-center text-zinc-500">Memuat menu...</p> : error ? <p className="py-12 text-center text-red-400">Gagal memuat menu: {error}</p> : <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visible.map(p => <article key={p.id} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"><button type="button" onClick={() => p.image_url && setPreview(p)} className="block h-44 w-full overflow-hidden bg-zinc-800"><div className="h-full w-full">{p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover transition hover:scale-[1.02]" loading="lazy" onError={e => { e.currentTarget.style.display = "none"; }} /> : <div className="flex h-full items-center justify-center text-6xl">🍽️</div>}</div></button><div className="p-4"><p className="text-xs text-emerald-400">{p.category}</p><h2 className="mt-1 font-semibold">{p.name}</h2><p className="mt-1 text-xs leading-5 text-zinc-500">{p.description || "Menu pilihan rumah makan."}</p><div className="mt-4 flex items-center justify-between"><span className="font-bold">{rupiah(p.price)}</span>{cart[p.id] ? <div className="flex items-center gap-3 rounded-full bg-zinc-800 px-2 py-1"><button onClick={() => remove(p.id)} className="h-7 w-7 rounded-full bg-zinc-700">−</button><span className="text-sm">{cart[p.id]}</span><button onClick={() => add(p.id)} className="h-7 w-7 rounded-full bg-emerald-500 text-zinc-950">+</button></div> : <button onClick={() => add(p.id)} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950">Tambah</button>}</div></div></article>)}</section>}
    </div>

    {count > 0 && <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 pointer-events-none"><div className="mx-auto flex max-w-5xl items-center gap-2 rounded-2xl border border-emerald-400/20 bg-zinc-900/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl pointer-events-auto"><button onClick={() => setShowCart(true)} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-zinc-800"><span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500 text-zinc-950"><ShoppingCart size={19}/><span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[10px] font-black text-zinc-900">{count}</span></span><span className="min-w-0"><b className="block truncate text-sm">Keranjang</b><small className="block truncate text-xs text-zinc-400">{count} item · {rupiah(total)}</small></span></button><button onClick={checkout} className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-zinc-950 shadow-lg shadow-emerald-500/20">Checkout <ArrowRight size={17}/></button></div></div>}

    {showCart && <div className="fixed inset-0 z-50 bg-black/75 p-4" onClick={() => setShowCart(false)}><div className="mx-auto mt-8 max-h-[85vh] max-w-lg overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Keranjang</h2><p className="mt-1 text-xs text-zinc-500">Periksa pesanan sebelum checkout.</p></div><button onClick={() => setShowCart(false)} className="rounded-xl bg-zinc-800 p-2 text-zinc-400"><X size={18}/></button></div><div className="mt-5 space-y-3">{products.filter(p => cart[p.id]).map(p => <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-zinc-800 p-3"><div className="min-w-0"><p className="truncate font-medium">{p.name}</p><p className="text-sm text-zinc-500">{rupiah(p.price)} × {cart[p.id]}</p></div><div className="flex shrink-0 gap-2"><button onClick={() => remove(p.id)} className="rounded-lg bg-zinc-700 px-3 py-1.5">−</button><span className="grid min-w-7 place-items-center text-sm">{cart[p.id]}</span><button onClick={() => add(p.id)} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-zinc-950">+</button></div></div>)}</div><div className="mt-5 border-t border-zinc-800 pt-4"><div className="flex justify-between text-lg font-bold"><span>Total sementara</span><span>{rupiah(total)}</span></div><button onClick={checkout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 font-black text-zinc-950">Lanjut ke Checkout <ArrowRight size={18}/></button></div></div></div>}
    {preview && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={() => setPreview(null)}><div className="relative max-h-[90vh] max-w-3xl" onClick={e => e.stopPropagation()}><button type="button" onClick={() => setPreview(null)} className="absolute -right-2 -top-12 rounded-full bg-zinc-800 px-4 py-2 text-white">✕</button><img src={preview.image_url!} alt={preview.name} className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl" /><p className="mt-3 text-center font-semibold text-white">{preview.name}</p></div></div>}
  </main>;
}
