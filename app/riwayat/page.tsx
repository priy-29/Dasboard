"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RiwayatPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const saved = sessionStorage.getItem("dasboard_order_code") || "";
    if (saved) setCode(saved);
  }, []);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = code.trim().toUpperCase();
    if (!/^RMK-[A-Z0-9]{6}$/.test(value)) {
      setError("Format Order ID tidak valid. Contoh: RMK-8X2A9P");
      return;
    }
    setError("");
    sessionStorage.setItem("dasboard_order_code", value);
    router.push(`/menu/status?order=${encodeURIComponent(value)}`);
  }
  return <main className="min-h-screen bg-zinc-950 p-5 text-white"><div className="mx-auto max-w-md pt-10"><button onClick={()=>router.push("/menu")} className="mb-8 text-sm text-zinc-500">← Kembali ke Menu</button><div className="text-center"><div className="text-5xl">🧾</div><h1 className="mt-3 text-2xl font-black">Riwayat Pesanan</h1><p className="mt-2 text-sm text-zinc-500">Masukkan Order ID untuk melihat status pesananmu.</p></div><form onSubmit={submit} className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-5"><label className="text-sm font-semibold">Order ID<input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono tracking-widest outline-none focus:border-emerald-500" placeholder="RMK-8X2A9P" maxLength={10} autoCapitalize="characters"/></label>{error&&<p className="mt-3 rounded-xl bg-red-950/40 p-3 text-sm text-red-400">{error}</p>}<button className="mt-4 w-full rounded-xl bg-emerald-500 py-3.5 font-black text-zinc-950">🔎 Verifikasi & Lihat Pesanan</button></form><p className="mt-5 text-center text-xs text-zinc-600">Order ID diverifikasi ke database. Tanpa ID yang valid, data pesanan tidak akan ditampilkan.</p></div></main>;
}
