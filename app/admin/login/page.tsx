"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(e: FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.user?.app_metadata?.role !== "admin") {
      await supabase.auth.signOut();
      setError("Akun ini bukan akun admin."); setLoading(false); return;
    }
    router.replace("/admin"); router.refresh();
  }

  return <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-5 text-white"><div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-7 shadow-2xl"><div className="mb-7"><p className="text-sm text-emerald-400">Dasboard</p><h1 className="mt-1 text-2xl font-bold">Login Admin</h1><p className="mt-1 text-sm text-zinc-500">Kelola pesanan dan menu rumah makan.</p></div><form onSubmit={login} className="space-y-4"><label className="block text-sm">Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-emerald-500" placeholder="admin@email.com" /></label><label className="block text-sm">Password<input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-emerald-500" placeholder="••••••••" /></label>{error && <p className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">{error}</p>}<button disabled={loading} className="w-full rounded-xl bg-emerald-500 py-3 font-semibold text-zinc-950 disabled:opacity-50">{loading ? "Masuk..." : "Masuk ke Dashboard"}</button></form></div></main>;
}
