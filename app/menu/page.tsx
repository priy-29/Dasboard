"use client";

import { useMemo, useState } from "react";

const products = [
  { id: 1, name: "Nasi Ayam Bakar", category: "Makanan", price: 22000, emoji: "🍗", desc: "Nasi hangat, ayam bakar, sambal dan lalapan." },
  { id: 2, name: "Nasi Goreng Spesial", category: "Makanan", price: 20000, emoji: "🍳", desc: "Nasi goreng dengan telur, ayam dan sayuran." },
  { id: 3, name: "Mie Goreng Jawa", category: "Makanan", price: 18000, emoji: "🍜", desc: "Mie goreng khas Jawa dengan topping lengkap." },
  { id: 4, name: "Es Teh Manis", category: "Minuman", price: 5000, emoji: "🧋", desc: "Teh manis dingin yang menyegarkan." },
  { id: 5, name: "Es Jeruk", category: "Minuman", price: 7000, emoji: "🍊", desc: "Jeruk segar dengan es." },
  { id: 6, name: "Kopi Susu", category: "Minuman", price: 12000, emoji: "☕", desc: "Kopi susu creamy, cocok untuk teman makan." },
];

const rupiah = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export default function MenuPage() {
  const [category, setCategory] = useState("Semua");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [showCart, setShowCart] = useState(false);

  const visible = products.filter(p => category === "Semua" || p.category === category);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = useMemo(() => products.reduce((sum, p) => sum + p.price * (cart[p.id] || 0), 0), [cart]);

  function add(id: number) { setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 })); }
  function remove(id: number) { setCart(c => { const next = { ...c }; if ((next[id] || 0) <= 1) delete next[id]; else next[id]--; return next; }); }

  return <main className="min-h-screen bg-zinc-950 pb-28">
    <header className="border-b border-zinc-800 bg-zinc-900/80"><div className="mx-auto max-w-5xl px-5 py-5"><p className="text-sm text-emerald-400">Selamat datang 👋</p><h1 className="mt-1 text-2xl font-bold">Rumah Makan Kita</h1><p className="mt-1 text-sm text-zinc-500">Pesan makanan favoritmu dengan mudah.</p></div></header>
    <div className="mx-auto max-w-5xl px-5">
      <div className="sticky top-0 z-10 -mx-5 overflow-x-auto bg-zinc-950/95 px-5 py-4 backdrop-blur"><div className="flex gap-2">{["Semua", "Makanan", "Minuman"].map(c => <button key={c} onClick={() => setCategory(c)} className={`rounded-full px-4 py-2 text-sm ${category === c ? "bg-emerald-500 font-semibold text-zinc-950" : "bg-zinc-900 text-zinc-400"}`}>{c}</button>)}</div></div>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visible.map(p => <article key={p.id} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"><div className="flex h-36 items-center justify-center bg-zinc-800 text-6xl">{p.emoji}</div><div className="p-4"><p className="text-xs text-emerald-400">{p.category}</p><h2 className="mt-1 font-semibold">{p.name}</h2><p className="mt-1 text-xs leading-5 text-zinc-500">{p.desc}</p><div className="mt-4 flex items-center justify-between"><span className="font-bold">{rupiah(p.price)}</span>{cart[p.id] ? <div className="flex items-center gap-3 rounded-full bg-zinc-800 px-2 py-1"><button onClick={() => remove(p.id)} className="h-7 w-7 rounded-full bg-zinc-700">−</button><span className="text-sm">{cart[p.id]}</span><button onClick={() => add(p.id)} className="h-7 w-7 rounded-full bg-emerald-500 text-zinc-950">+</button></div> : <button onClick={() => add(p.id)} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950">Tambah</button>}</div></div></article>)}</section>
    </div>
    {count > 0 && <button onClick={() => setShowCart(true)} className="fixed bottom-5 left-1/2 flex w-[calc(100%-40px)] max-w-5xl -translate-x-1/2 items-center justify-between rounded-2xl bg-emerald-500 px-5 py-4 font-semibold text-zinc-950 shadow-2xl"><span>{count} item di keranjang</span><span>{rupiah(total)} →</span></button>}
    {showCart && <div className="fixed inset-0 z-30 bg-black/70 p-5"><div className="mx-auto mt-12 max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-5"><div className="flex justify-between"><h2 className="text-xl font-bold">Keranjang</h2><button onClick={() => setShowCart(false)} className="text-zinc-500">✕</button></div><div className="mt-5 space-y-3">{products.filter(p => cart[p.id]).map(p => <div key={p.id} className="flex items-center justify-between rounded-xl bg-zinc-800 p-3"><div><p className="font-medium">{p.name}</p><p className="text-sm text-zinc-500">{rupiah(p.price)} × {cart[p.id]}</p></div><div className="flex gap-2"><button onClick={() => remove(p.id)} className="rounded-lg bg-zinc-700 px-3">−</button><button onClick={() => add(p.id)} className="rounded-lg bg-emerald-500 px-3 text-zinc-950">+</button></div></div>)}</div><div className="mt-5 border-t border-zinc-800 pt-4"><div className="flex justify-between text-lg font-bold"><span>Total</span><span>{rupiah(total)}</span></div><button className="mt-4 w-full rounded-xl bg-emerald-500 py-3 font-semibold text-zinc-950">Lanjut Checkout</button></div></div></div>}
  </main>;
}
