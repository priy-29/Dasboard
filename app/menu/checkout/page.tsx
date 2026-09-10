"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

const CART_KEY = "dasboard_cart";

type Cart = Record<string, number>;

export default function CheckoutPage() {
  const [cart, setCart] = useState<Cart>({});
  const [sent, setSent] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "", payment: "cod" });

  useEffect(() => {
    try {
      setCart(JSON.parse(sessionStorage.getItem(CART_KEY) || "{}"));
    } catch {
      setCart({});
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const items = Object.entries(cart)
      .filter(([, quantity]) => quantity > 0)
      .map(([product_id, quantity]) => ({ product_id, quantity }));

    if (!items.length) {
      setError("Keranjang masih kosong. Kembali ke menu dan pilih pesanan.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: orderError } = await supabase.rpc("create_order_with_items", {
        p_customer_name: form.name,
        p_customer_phone: form.phone,
        p_customer_address: form.address,
        p_notes: form.notes,
        p_payment_method: form.payment,
        p_items: items,
      });

      if (orderError) throw orderError;

      sessionStorage.removeItem(CART_KEY);
      setOrderId(data);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pesanan gagal dikirim.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-5"><div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center"><div className="text-5xl">✅</div><h1 className="mt-5 text-2xl font-bold">Pesanan berhasil!</h1><p className="mt-2 text-zinc-500">Pesananmu sudah masuk ke sistem rumah makan.</p><p className="mt-4 rounded-xl bg-zinc-800 p-3 text-xs text-zinc-400">ID Pesanan: {orderId}</p><button onClick={() => location.href = "/menu"} className="mt-6 w-full rounded-xl bg-emerald-500 py-3 font-semibold text-zinc-950">Kembali ke Menu</button></div></main>;
  }

  return <main className="min-h-screen bg-zinc-950 p-5"><div className="mx-auto max-w-lg"><button onClick={() => history.back()} className="mb-6 text-sm text-zinc-500">← Kembali</button><h1 className="text-2xl font-bold">Checkout</h1><p className="mt-1 text-sm text-zinc-500">Lengkapi data untuk mengirim pesanan.</p><form onSubmit={submit} className="mt-7 space-y-4">
    <label className="block text-sm">Nama<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none focus:border-emerald-500" placeholder="Nama lengkap" /></label>
    <label className="block text-sm">No. WhatsApp<input required type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none focus:border-emerald-500" placeholder="08xxxxxxxxxx" /></label>
    <label className="block text-sm">Alamat<textarea required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={3} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none focus:border-emerald-500" placeholder="Alamat pengantaran" /></label>
    <label className="block text-sm">Catatan pesanan<textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none focus:border-emerald-500" placeholder="Contoh: sambalnya dipisah" /></label>
    <label className="block text-sm">Metode pembayaran<select value={form.payment} onChange={e => setForm({ ...form, payment: e.target.value })} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none"><option value="cod">COD</option><option value="transfer">Transfer Bank</option><option value="qris">QRIS</option></select></label>
    {error && <p className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">{error}</p>}
    <button disabled={loading} className="w-full rounded-xl bg-emerald-500 py-3.5 font-semibold text-zinc-950 disabled:opacity-50">{loading ? "Mengirim pesanan..." : "Kirim Pesanan"}</button>
  </form></div></main>;
}
