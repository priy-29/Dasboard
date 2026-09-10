"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

const CART_KEY = "dasboard_cart";
type Cart = Record<string, number>;
type ReceiptItem = { name: string; price: number; quantity: number };
const rupiah = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export default function CheckoutPage() {
  const [cart, setCart] = useState<Cart>({});
  const [sent, setSent] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "", payment: "cod" });

  useEffect(() => {
    try { setCart(JSON.parse(sessionStorage.getItem(CART_KEY) || "{}")); } catch { setCart({}); }
  }, []);

  const subtotal = useMemo(() => receiptItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [receiptItems]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const items = Object.entries(cart).filter(([, quantity]) => quantity > 0).map(([product_id, quantity]) => ({ product_id, quantity }));
    if (!items.length) { setError("Keranjang masih kosong. Kembali ke menu dan pilih pesanan."); return; }

    setLoading(true);
    try {
      const productIds = items.map(i => i.product_id);
      const { data: products, error: productsError } = await supabase.from("products").select("id,name,price").in("id", productIds);
      if (productsError) throw productsError;
      const receipt = items.map(item => {
        const product = (products || []).find(p => p.id === item.product_id);
        return product ? { name: product.name, price: product.price, quantity: item.quantity } : null;
      }).filter(Boolean) as ReceiptItem[];

      const { data, error: orderError } = await supabase.rpc("create_order_with_items", {
        p_customer_name: form.name,
        p_customer_phone: form.phone,
        p_customer_address: form.address,
        p_notes: form.notes,
        p_payment_method: form.payment,
        p_items: items,
      });
      if (orderError) throw orderError;

      setReceiptItems(receipt);
      setOrderId(data);
      sessionStorage.removeItem(CART_KEY);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pesanan gagal dikirim.");
    } finally { setLoading(false); }
  }

  if (sent) {
    return <main className="min-h-screen bg-zinc-950 p-5 text-white"><div className="mx-auto max-w-md"><div className="mb-5 text-center"><div className="text-5xl">✅</div><h1 className="mt-3 text-2xl font-bold">Pesanan berhasil!</h1><p className="mt-1 text-sm text-zinc-500">Ini struk pesanan kamu.</p></div><section id="receipt" className="rounded-3xl bg-white p-5 text-zinc-900 shadow-2xl"><div className="text-center"><h2 className="text-xl font-extrabold">RUMAH MAKAN KITA</h2><p className="mt-1 text-xs text-zinc-500">Struk Pesanan</p><div className="my-4 border-t border-dashed border-zinc-300" /></div><div className="space-y-1 text-xs"><div className="flex justify-between gap-4"><span>No. Pesanan</span><span className="max-w-[210px] text-right font-medium">{orderId}</span></div><div className="flex justify-between"><span>Nama</span><span className="font-medium">{form.name}</span></div><div className="flex justify-between"><span>WhatsApp</span><span className="font-medium">{form.phone}</span></div><div className="flex justify-between"><span>Pembayaran</span><span className="font-medium uppercase">{form.payment}</span></div></div><div className="my-4 border-t border-dashed border-zinc-300" /><div className="space-y-3">{receiptItems.map((item, index) => <div key={`${item.name}-${index}`} className="flex justify-between gap-3 text-sm"><div><p className="font-semibold">{item.name}</p><p className="text-xs text-zinc-500">{item.quantity} × {rupiah(item.price)}</p></div><span className="font-semibold">{rupiah(item.price * item.quantity)}</span></div>)}</div><div className="my-4 border-t border-zinc-300" /><div className="flex justify-between text-base font-extrabold"><span>Subtotal</span><span>{rupiah(subtotal)}</span></div><p className="mt-3 text-center text-[11px] text-zinc-500">Ongkir dihitung sesuai pengantaran. Terima kasih sudah memesan 🙏</p><div className="mt-4 border-t border-dashed border-zinc-300 pt-3 text-center text-[10px] text-zinc-400">Alamat: {form.address}</div></section><div className="mt-4 grid grid-cols-2 gap-3"><button onClick={() => window.print()} className="rounded-xl border border-zinc-800 bg-zinc-900 py-3 font-semibold">🧾 Cetak</button><button onClick={() => location.href = "/menu"} className="rounded-xl bg-emerald-500 py-3 font-semibold text-zinc-950">Kembali ke Menu</button></div></div><style jsx global>{`@media print { body { background: white !important; } body > * { visibility: hidden; } #receipt, #receipt * { visibility: visible; } #receipt { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border-radius: 0 !important; } }`}</style></main>;
  }

  return <main className="min-h-screen bg-zinc-950 p-5 text-white"><div className="mx-auto max-w-lg"><button onClick={() => history.back()} className="mb-6 text-sm text-zinc-500">← Kembali</button><h1 className="text-2xl font-bold">Checkout</h1><p className="mt-1 text-sm text-zinc-500">Lengkapi data untuk mengirim pesanan.</p><form onSubmit={submit} className="mt-7 space-y-4"><label className="block text-sm">Nama<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none focus:border-emerald-500" placeholder="Nama lengkap" /></label><label className="block text-sm">No. WhatsApp<input required type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none focus:border-emerald-500" placeholder="08xxxxxxxxxx" /></label><label className="block text-sm">Alamat<textarea required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={3} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none focus:border-emerald-500" placeholder="Alamat pengantaran" /></label><label className="block text-sm">Catatan pesanan<textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none focus:border-emerald-500" placeholder="Contoh: sambalnya dipisah" /></label><label className="block text-sm">Metode pembayaran<select value={form.payment} onChange={e => setForm({ ...form, payment: e.target.value })} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none"><option value="cod">COD</option><option value="transfer">Transfer Bank</option><option value="qris">QRIS</option></select></label>{error && <p className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">{error}</p>}<button disabled={loading} className="w-full rounded-xl bg-emerald-500 py-3.5 font-semibold text-zinc-950 disabled:opacity-50">{loading ? "Mengirim pesanan..." : "Kirim Pesanan"}</button></form></div></main>;
}
