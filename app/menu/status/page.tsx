"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type OrderStatus = { id: string; status: string; delivery_method: "delivery" | "pickup"; created_at: string };

const steps = {
  delivery: ["pending", "processing", "completed"],
  pickup: ["pending", "processing", "completed"],
};
const labels: Record<string, string> = { pending: "Pesanan diterima", processing: "Sedang diproses", completed: "Pesanan selesai", cancelled: "Pesanan dibatalkan" };

export default function StatusPage() {
  const [id, setId] = useState("");
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const check = useCallback(async (orderId: string) => {
    if (!orderId) return;
    const { data, error: rpcError } = await supabase.rpc("get_order_status", { p_order_id: orderId });
    if (rpcError) { setError(rpcError.message); return; }
    if (!data) { setError("Pesanan tidak ditemukan. Periksa nomor pesanan."); return; }
    setError("");
    setOrder(data as OrderStatus);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("dasboard_order_id") || "";
    if (saved) { setId(saved); check(saved); }
  }, [check]);

  useEffect(() => {
    if (!order?.id || order.status === "completed" || order.status === "cancelled") return;
    const timer = window.setInterval(() => check(order.id), 5000);
    return () => window.clearInterval(timer);
  }, [order?.id, order?.status, check]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = id.trim();
    if (!value) return;
    setLoading(true); setError("");
    sessionStorage.setItem("dasboard_order_id", value);
    await check(value);
    setLoading(false);
  }

  const isCancelled = order?.status === "cancelled";
  const currentIndex = order ? steps[order.delivery_method].indexOf(order.status) : -1;

  return <main className="min-h-screen bg-zinc-950 p-5 text-white"><div className="mx-auto max-w-md"><button onClick={() => location.href="/menu"} className="mb-6 text-sm text-zinc-500">← Kembali ke Menu</button><div className="text-center"><div className="text-5xl">📦</div><h1 className="mt-3 text-2xl font-bold">Status Pesanan</h1><p className="mt-1 text-sm text-zinc-500">Cek perkembangan pesanan kamu.</p></div>
  <form onSubmit={submit} className="mt-7 flex gap-2"><input value={id} onChange={e=>setId(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm outline-none focus:border-emerald-500" placeholder="Masukkan nomor pesanan"/><button disabled={loading} className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-zinc-950">{loading?"Cek...":"Cek"}</button></form>
  {error&&<p className="mt-4 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">{error}</p>}
  {order&&<section className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900 p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs text-zinc-500">Nomor Pesanan</p><p className="mt-1 break-all font-mono text-sm">{order.id}</p></div><span className="rounded-full bg-zinc-800 px-3 py-1 text-xs">{order.delivery_method === "delivery" ? "🚚 Diantar" : "🏠 Ambil sendiri"}</span></div>
  <div className="mt-7 text-center"><div className="text-4xl">{isCancelled?"❌":order.status==="completed"?"✅":order.status==="processing"?"👨‍🍳":"🕐"}</div><h2 className="mt-2 text-xl font-bold">{labels[order.status]||order.status}</h2>{order.status!=="completed"&&order.status!=="cancelled"&&<p className="mt-1 text-xs text-zinc-500">Status diperbarui otomatis setiap beberapa detik.</p>}</div>
  {!isCancelled&&<div className="mt-7 space-y-4">{steps[order.delivery_method].map((step,index)=><div key={step} className="flex items-center gap-3"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${index<=currentIndex?"bg-emerald-500 text-zinc-950":"bg-zinc-800 text-zinc-500"}`}>{index<=currentIndex?"✓":index+1}</div><div><p className={`font-medium ${index<=currentIndex?"text-white":"text-zinc-500"}`}>{labels[step]}</p>{step==="processing"&&<p className="text-xs text-zinc-500">Pesanan sedang disiapkan.</p>}</div></div>)}</div>}
  {isCancelled&&<div className="mt-6 rounded-xl bg-red-950/40 p-3 text-center text-sm text-red-400">Pesanan ini dibatalkan oleh admin.</div>}
  </section>}
  <div className="mt-5 text-center"><button onClick={()=>location.href="/menu"} className="text-sm text-emerald-400">Pesan lagi</button></div></div></main>;
}
