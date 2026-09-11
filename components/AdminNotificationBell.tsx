"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, Clock3, Package, X } from "lucide-react";
import { supabase } from "../lib/supabase";

type Notice = { id: string; customer_name: string; total: number; created_at: string; status: string };

const money = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export default function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notice[]>([]);
  const [seen, setSeen] = useState<string[]>([]);

  const load = async () => {
    const { data } = await supabase.from("orders").select("id,customer_name,total,created_at,status").eq("status", "pending").order("created_at", { ascending: false }).limit(8);
    setItems((data || []) as Notice[]);
  };

  useEffect(() => {
    void load();
    const channel = supabase.channel("admin-notifications").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => void load()).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    try { setSeen(JSON.parse(localStorage.getItem("admin_seen_notifications") || "[]")); } catch { setSeen([]); }
  }, []);

  const unread = items.filter(x => !seen.includes(x.id)).length;
  const markAll = () => {
    const next = Array.from(new Set([...seen, ...items.map(x => x.id)])).slice(-100);
    setSeen(next);
    localStorage.setItem("admin_seen_notifications", JSON.stringify(next));
  };

  return <>
    <button aria-label="Notifikasi pesanan" onClick={() => { setOpen(v => !v); if (!open) markAll(); }} className="admin-notification-trigger fixed right-3 top-3 z-[90] grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-[#0d1117]/95 text-zinc-300 shadow-lg backdrop-blur-xl lg:right-5 lg:top-4">
      <Bell size={18}/>{unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">{unread > 9 ? "9+" : unread}</span>}
    </button>
    {open && <div className="fixed inset-0 z-[89]" onClick={() => setOpen(false)} />}
    {open && <section className="fixed right-3 top-[62px] z-[90] w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-white/10 bg-[#10141a] shadow-2xl lg:right-5 lg:top-[68px]">
      <div className="flex items-center justify-between border-b border-white/[.07] px-4 py-3"><div><p className="font-bold">Notifikasi</p><p className="text-[10px] text-zinc-500">Pesanan yang perlu diperiksa</p></div><button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5"><X size={16}/></button></div>
      <div className="max-h-[55vh] overflow-y-auto p-2">
        {items.length === 0 ? <div className="px-4 py-10 text-center"><CheckCircle2 className="mx-auto text-emerald-400" size={28}/><p className="mt-3 text-sm font-bold">Semua aman</p><p className="mt-1 text-xs text-zinc-500">Tidak ada pesanan baru.</p></div> : items.map(item => <Link key={item.id} href="/admin" onClick={() => setOpen(false)} className="flex gap-3 rounded-xl p-3 hover:bg-white/[.05]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-400/10 text-amber-300"><Clock3 size={16}/></span><span className="min-w-0 flex-1"><b className="block truncate text-xs">Pesanan baru · {item.customer_name}</b><span className="mt-1 block text-[10px] text-zinc-500">#{item.id.slice(0,8)} · {money(item.total)}</span><span className="mt-1 block text-[10px] text-amber-300">Menunggu diproses</span></span><Package size={14} className="mt-1 text-zinc-600"/></Link>)}
      </div>
      <div className="border-t border-white/[.07] p-2"><Link href="/admin" onClick={() => setOpen(false)} className="block rounded-xl bg-white/[.05] py-2.5 text-center text-[11px] font-bold text-zinc-300 hover:bg-white/[.08]">Buka semua pesanan</Link></div>
    </section>}
  </>;
}
