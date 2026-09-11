"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const ADMIN_EMAIL = "maspri2904@gmail.com";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled || !data.user) return;
      if (data.user.email?.toLowerCase() === ADMIN_EMAIL) { router.replace("/admin"); return; }
      const { data: courier } = await supabase.from("couriers").select("is_active").eq("id", data.user.id).maybeSingle();
      if (!cancelled && courier?.is_active) router.replace("/courier");
    })();
    return () => { cancelled = true; };
  }, [router]);

  async function login(e: FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
      const { data: courier } = await supabase.from("couriers").select("is_active").eq("id", data.user?.id || "").maybeSingle();
      await supabase.auth.signOut();
      if (courier?.is_active) { router.replace("/courier/login"); router.refresh(); return; }
      setError("Email ini bukan akun admin."); setLoading(false); return;
    }
    router.replace("/admin"); router.refresh();
  }

  return <main className="admin-login-page relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07090d] p-5 text-white">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,.18),transparent_42%)]" />
    <div className="relative w-full max-w-md overflow-hidden rounded-[30px] border border-white/10 bg-[#101419]/95 p-6 shadow-[0_30px_90px_rgba(0,0,0,.55)] backdrop-blur-2xl sm:p-8">
      <div className="mb-7 flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-400 text-[#06110c] shadow-lg shadow-emerald-500/10"><ShieldCheck size={23}/></div>
        <div><p className="text-[10px] font-black uppercase tracking-[.22em] text-emerald-400">Dasboard · Admin</p><h1 className="mt-1 text-2xl font-black tracking-tight">Masuk ke Dashboard</h1><p className="mt-1 text-sm text-zinc-500">Kelola pesanan, menu, ongkir, dan kurir.</p></div>
      </div>
      <form onSubmit={login} className="space-y-4">
        <label className="block text-sm font-medium">Email<input required autoComplete="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 outline-none transition focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10" placeholder="admin@email.com" /></label>
        <label className="block text-sm font-medium">Password<input required autoComplete="current-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 outline-none transition focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10" placeholder="••••••••" /></label>
        {error && <p className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">⚠️ {error}</p>}
        <button disabled={loading} className="h-12 w-full rounded-2xl bg-emerald-400 font-black text-[#06110c] shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-50">{loading ? "Memeriksa akun..." : "Masuk ke Dashboard"}</button>
      </form>
      <div className="mt-6 flex items-center justify-between border-t border-white/[.07] pt-5 text-xs"><span className="text-zinc-600">Bukan akun admin?</span><Link href="/courier/login" className="font-bold text-orange-300 hover:text-orange-200">Login Kurir →</Link></div>
    </div>
  </main>;
}
