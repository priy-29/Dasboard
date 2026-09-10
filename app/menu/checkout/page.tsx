"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

const CART_KEY = "dasboard_cart";
const RESTAURANT_LAT = -7.396963;
const RESTAURANT_LNG = 109.199585;
type Cart = Record<string, number>;
type ReceiptItem = { name: string; price: number; quantity: number };
const rupiah = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const r = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return r * 2 * Math.asin(Math.sqrt(a));
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<Cart>({});
  const [sent, setSent] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [distance, setDistance] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [settings, setSettings] = useState({ base_fee: 5000, per_km_fee: 2000, free_shipping_minimum: 50000 });
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "", payment: "cod" });

  useEffect(() => {
    try { setCart(JSON.parse(sessionStorage.getItem(CART_KEY) || "{}")); } catch { setCart({}); }
    supabase.from("delivery_settings").select("base_fee,per_km_fee,free_shipping_minimum,restaurant_lat,restaurant_lng").limit(1).maybeSingle().then(({ data }) => {
      if (data) setSettings({ base_fee: data.base_fee, per_km_fee: data.per_km_fee, free_shipping_minimum: data.free_shipping_minimum });
    });
  }, []);

  const subtotal = useMemo(() => receiptItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [receiptItems]);

  const previewSubtotal = useMemo(() => 0, []);

  function getLocation() {
    if (!navigator.geolocation) { setLocationStatus("error"); setError("Perangkat ini tidak mendukung GPS."); return; }
    setLocationStatus("loading");
    setError("");
    navigator.geolocation.getCurrentPosition(
      position => {
        const next = { lat: position.coords.latitude, lng: position.coords.longitude };
        const d = distanceKm(next.lat, next.lng, RESTAURANT_LAT, RESTAURANT_LNG);
        setCoords(next);
        setDistance(d);
        setLocationStatus("ready");
      },
      () => { setLocationStatus("error"); setError("Lokasi tidak bisa diambil. Izinkan akses lokasi/GPS lalu coba lagi."); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }

  useEffect(() => {
    if (deliveryMethod !== "delivery") {
      setDeliveryFee(0);
      return;
    }
    if (distance === null) return;
    if (subtotal >= settings.free_shipping_minimum) setDeliveryFee(0);
    else setDeliveryFee(settings.base_fee + Math.ceil(distance) * settings.per_km_fee);
  }, [deliveryMethod, distance, subtotal, settings]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const items = Object.entries(cart).filter(([, quantity]) => quantity > 0).map(([product_id, quantity]) => ({ product_id, quantity }));
    if (!items.length) { setError("Keranjang masih kosong. Kembali ke menu dan pilih pesanan."); return; }
    if (deliveryMethod === "delivery" && !form.address.trim()) { setError("Alamat pengantaran wajib diisi."); return; }
    if (deliveryMethod === "delivery" && !coords) { setError("Ambil lokasi GPS terlebih dahulu untuk menghitung ongkir."); return; }

    setLoading(true);
    try {
      const productIds = items.map(i => i.product_id);
      const { data: products, error: productsError } = await supabase.from("products").select("id,name,price").in("id", productIds);
      if (productsError) throw productsError;
      const receipt = items.map(item => {
        const product = (products || []).find(p => p.id === item.product_id);
        return product ? { name: product.name, price: product.price, quantity: item.quantity } : null;
      }).filter(Boolean) as ReceiptItem[];
      const actualSubtotal = receipt.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const actualDistance = deliveryMethod === "delivery" && coords ? distanceKm(coords.lat, coords.lng, RESTAURANT_LAT, RESTAURANT_LNG) : null;
      const actualFee = deliveryMethod === "delivery" && actualDistance !== null && actualSubtotal < settings.free_shipping_minimum
        ? settings.base_fee + Math.ceil(actualDistance) * settings.per_km_fee : 0;

      const { data, error: orderError } = await supabase.rpc("create_order_with_items", {
        p_customer_name: form.name,
        p_customer_phone: form.phone,
        p_customer_address: deliveryMethod === "delivery" ? form.address : "Ambil sendiri",
        p_notes: form.notes,
        p_payment_method: form.payment,
        p_items: items,
        p_delivery_method: deliveryMethod,
        p_customer_lat: deliveryMethod === "delivery" ? coords?.lat : null,
        p_customer_lng: deliveryMethod === "delivery" ? coords?.lng : null,
      });
      if (orderError) throw orderError;

      setDeliveryFee(actualFee);
      setDistance(actualDistance);
      setReceiptItems(receipt);
      setOrderId(data);
      sessionStorage.removeItem(CART_KEY);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pesanan gagal dikirim.");
    } finally { setLoading(false); }
  }

  if (sent) {
    return <main className="min-h-screen bg-zinc-950 p-5 text-white"><div className="mx-auto max-w-md"><div className="mb-5 text-center"><div className="text-5xl">✅</div><h1 className="mt-3 text-2xl font-bold">Pesanan berhasil!</h1><p className="mt-1 text-sm text-zinc-500">Ini struk pesanan kamu.</p></div><section id="receipt" className="rounded-3xl bg-white p-5 text-zinc-900 shadow-2xl"><div className="text-center"><h2 className="text-xl font-extrabold">RUMAH MAKAN KITA</h2><p className="mt-1 text-xs text-zinc-500">Struk Pesanan</p><div className="my-4 border-t border-dashed border-zinc-300" /></div><div className="space-y-1 text-xs"><div className="flex justify-between gap-4"><span>No. Pesanan</span><span className="max-w-[210px] text-right font-medium">{orderId}</span></div><div className="flex justify-between"><span>Nama</span><span className="font-medium">{form.name}</span></div><div className="flex justify-between"><span>WhatsApp</span><span className="font-medium">{form.phone}</span></div><div className="flex justify-between"><span>Pesanan</span><span className="font-medium">{deliveryMethod === "delivery" ? "Diantar" : "Ambil sendiri"}</span></div><div className="flex justify-between"><span>Pembayaran</span><span className="font-medium uppercase">{form.payment}</span></div></div><div className="my-4 border-t border-dashed border-zinc-300" /><div className="space-y-3">{receiptItems.map((item, index) => <div key={`${item.name}-${index}`} className="flex justify-between gap-3 text-sm"><div><p className="font-semibold">{item.name}</p><p className="text-xs text-zinc-500">{item.quantity} × {rupiah(item.price)}</p></div><span className="font-semibold">{rupiah(item.price * item.quantity)}</span></div>)}</div><div className="my-4 border-t border-zinc-300" /><div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-semibold">{rupiah(subtotal)}</span></div><div className="mt-2 flex justify-between text-sm"><span>Ongkir</span><span className="font-semibold">{deliveryFee ? rupiah(deliveryFee) : "Rp0"}</span></div>{distance !== null && deliveryMethod === "delivery" && <div className="mt-1 flex justify-between text-xs text-zinc-500"><span>Jarak</span><span>{distance.toFixed(1)} km</span></div>}<div className="mt-2 flex justify-between text-base font-extrabold"><span>Total</span><span>{rupiah(subtotal + deliveryFee)}</span></div><div className="mt-4 border-t border-dashed border-zinc-300 pt-3 text-center text-[10px] text-zinc-400">Alamat: {deliveryMethod === "delivery" ? form.address : "Ambil sendiri di rumah makan"}</div></section><div className="mt-4 grid grid-cols-2 gap-3"><button onClick={() => window.print()} className="rounded-xl border border-zinc-800 bg-zinc-900 py-3 font-semibold">🧾 Cetak</button><button onClick={() => location.href = "/menu"} className="rounded-xl bg-emerald-500 py-3 font-semibold text-zinc-950">Kembali ke Menu</button></div></div><style jsx global>{`@media print { body { background: white !important; } body > * { visibility: hidden; } #receipt, #receipt * { visibility: visible; } #receipt { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border-radius: 0 !important; } }`}</style></main>;
  }

  return <main className="min-h-screen bg-zinc-950 p-5 text-white"><div className="mx-auto max-w-lg"><button onClick={() => history.back()} className="mb-6 text-sm text-zinc-500">← Kembali</button><h1 className="text-2xl font-bold">Checkout</h1><p className="mt-1 text-sm text-zinc-500">Pilih cara menerima pesanan.</p><form onSubmit={submit} className="mt-7 space-y-4"><div><p className="mb-2 text-sm font-medium">Cara menerima pesanan</p><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => setDeliveryMethod("delivery")} className={`rounded-2xl border p-4 text-left ${deliveryMethod === "delivery" ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-800 bg-zinc-900"}`}><div className="text-xl">🚚</div><div className="mt-2 font-semibold">Diantar</div><div className="mt-1 text-xs text-zinc-500">GPS + ongkir otomatis</div></button><button type="button" onClick={() => setDeliveryMethod("pickup")} className={`rounded-2xl border p-4 text-left ${deliveryMethod === "pickup" ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-800 bg-zinc-900"}`}><div className="text-xl">🏠</div><div className="mt-2 font-semibold">Ambil sendiri</div><div className="mt-1 text-xs text-zinc-500">Tanpa ongkir & GPS</div></button></div></div><label className="block text-sm">Nama<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none focus:border-emerald-500" placeholder="Nama lengkap" /></label><label className="block text-sm">No. WhatsApp<input required type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none focus:border-emerald-500" placeholder="08xxxxxxxxxx" /></label>{deliveryMethod === "delivery" && <><label className="block text-sm">Alamat pengantaran<textarea required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={3} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none focus:border-emerald-500" placeholder="Alamat pengantaran" /></label><button type="button" onClick={getLocation} disabled={locationStatus === "loading"} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-3 font-semibold disabled:opacity-50">{locationStatus === "loading" ? "📍 Mengambil lokasi..." : locationStatus === "ready" ? "✅ Lokasi berhasil diambil" : "📍 Ambil lokasi saya"}</button>{locationStatus === "ready" && distance !== null && <div className="rounded-xl border border-emerald-900 bg-emerald-950/30 p-3 text-sm"><div className="flex justify-between"><span className="text-zinc-400">Jarak</span><span>{distance.toFixed(1)} km</span></div><div className="mt-1 flex justify-between"><span className="text-zinc-400">Ongkir</span><span className="font-semibold">{deliveryFee ? rupiah(deliveryFee) : subtotal >= settings.free_shipping_minimum ? "Gratis" : rupiah(settings.base_fee + Math.ceil(distance) * settings.per_km_fee)}</span></div>{subtotal >= settings.free_shipping_minimum && <p className="mt-2 text-xs text-emerald-400">Gratis ongkir karena belanja minimal {rupiah(settings.free_shipping_minimum)}.</p>}</div>}</>}{deliveryMethod === "pickup" && <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-400">📍 Pesanan akan disiapkan untuk diambil sendiri di rumah makan. Tidak ada ongkir.</div>}<label className="block text-sm">Catatan pesanan<textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none focus:border-emerald-500" placeholder="Contoh: sambalnya dipisah" /></label><label className="block text-sm">Metode pembayaran<select value={form.payment} onChange={e => setForm({ ...form, payment: e.target.value })} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none"><option value="cod">COD</option><option value="transfer">Transfer Bank</option><option value="qris">QRIS</option></select></label><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm"><div className="flex justify-between"><span className="text-zinc-400">Ongkir</span><span>{deliveryMethod === "pickup" ? "Rp0" : distance === null ? "Ambil lokasi terlebih dahulu" : deliveryFee ? rupiah(deliveryFee) : subtotal >= settings.free_shipping_minimum ? "Gratis" : rupiah(settings.base_fee + Math.ceil(distance) * settings.per_km_fee)}</span></div>{distance !== null && deliveryMethod === "delivery" && <div className="mt-1 flex justify-between text-xs text-zinc-500"><span>Jarak</span><span>{distance.toFixed(1)} km</span></div>}</div>{error && <p className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">{error}</p>}<button disabled={loading} className="w-full rounded-xl bg-emerald-500 py-3.5 font-semibold text-zinc-950 disabled:opacity-50">{loading ? "Mengirim pesanan..." : "Kirim Pesanan"}</button></form></div></main>;
}
