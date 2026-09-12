"use client";

import { useEffect, useRef, useState } from "react";
import LiveMap from "../../components/LiveMap";
import { supabase } from "../../lib/supabase";

const REST_LAT = -7.396963;
const REST_LNG = 109.199585;
const ADMIN_EMAIL = "maspri2904@gmail.com";

type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  notes: string | null;
  payment_method: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  delivery_method: string;
  customer_lat: number | null;
  customer_lng: number | null;
  delivery_distance_km: number | null;
  courier_lat: number | null;
  courier_lng: number | null;
  courier_updated_at: string | null;
  courier_tracking: boolean;
  delivery_arrival_requested_at: string | null;
  delivery_confirmed_at: string | null;
};

type Point = {
  lat: number;
  lng: number;
  label: string;
  emoji: string;
  className: string;
};

function mapsUrl(lat: number, lng: number, originLat?: number | null, originLng?: number | null) {
  const origin = originLat != null && originLng != null
    ? `${originLat},${originLng}`
    : `${REST_LAT},${REST_LNG}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${lat},${lng}&travelmode=driving`;
}

export default function CourierPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [tab, setTab] = useState<"ready" | "active">("ready");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const watch = useRef<number | null>(null);

  async function loadTasks() {
    const { data, error: taskError } = await supabase.rpc("get_courier_tasks");
    if (taskError) {
      setError(`Gagal mengambil tugas kurir: ${taskError.message}`);
      setLoading(false);
      return;
    }

    const list = (Array.isArray(data) ? data : []) as Order[];
    setOrders(list);
    setOrder((current) => {
      if (!current) return null;
      const fresh = list.find((item) => item.id === current.id);
      if (!fresh) {
        setTracking(false);
        return null;
      }
      setTracking(Boolean(fresh.courier_tracking));
      return fresh;
    });
    setLoading(false);
  }

  function selectTask(nextOrder: Order) {
    setError("");
    setOrder(nextOrder);
    setTracking(Boolean(nextOrder.courier_tracking));
    setTab(nextOrder.status === "processing" ? "ready" : "active");
  }

  async function claimTask() {
    if (isAdmin || !order || order.status !== "processing" || claiming) return;
    setClaiming(true);
    setError("");
    const { data, error: claimError } = await supabase.rpc("claim_delivery_task", {
      p_order_id: order.id,
    });
    if (claimError) {
      setError(`Gagal mengambil pesanan: ${claimError.message}`);
    } else if (!data) {
      setError("Pesanan sudah diambil kurir lain atau status berubah.");
    } else {
      setTab("active");
      await loadTasks();
    }
    setClaiming(false);
  }

  async function sendLocation(id: string, lat: number, lng: number) {
    if (isAdmin) return;
    const { error: locationError } = await supabase.rpc("update_courier_location", {
      p_order_id: id,
      p_lat: lat,
      p_lng: lng,
    });
    if (locationError) {
      setError(`Gagal mengirim GPS: ${locationError.message}`);
      return;
    }
    setOrder((current) => current && current.id === id ? {
      ...current,
      courier_lat: lat,
      courier_lng: lng,
      courier_updated_at: new Date().toISOString(),
      courier_tracking: true,
    } : current);
  }

  async function startTracking() {
    if (isAdmin || !order || order.status !== "delivering" || order.delivery_arrival_requested_at) return;
    if (!navigator.geolocation) {
      setError("Browser ini tidak mendukung GPS.");
      return;
    }
    setError("");
    const orderId = order.id;
    const { error: trackingError } = await supabase.rpc("set_courier_tracking", {
      p_order_id: orderId,
      p_enabled: true,
    });
    if (trackingError) {
      setError(`Gagal mengaktifkan tracking: ${trackingError.message}`);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setTracking(true);
        void sendLocation(orderId, position.coords.latitude, position.coords.longitude);
        watch.current = navigator.geolocation.watchPosition(
          (nextPosition) => void sendLocation(
            orderId,
            nextPosition.coords.latitude,
            nextPosition.coords.longitude,
          ),
          (gpsError) => setError(`GPS: ${gpsError.message}`),
          { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 },
        );
      },
      (gpsError) => {
        setTracking(false);
        void supabase.rpc("set_courier_tracking", {
          p_order_id: orderId,
          p_enabled: false,
        });
        setError(`GPS: ${gpsError.message}. Izinkan lokasi untuk mulai OTW.`);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  }

  async function stopTracking() {
    if (isAdmin || !order) return;
    if (watch.current != null) {
      navigator.geolocation.clearWatch(watch.current);
      watch.current = null;
    }
    await supabase.rpc("set_courier_tracking", {
      p_order_id: order.id,
      p_enabled: false,
    });
    setTracking(false);
    await loadTasks();
  }

  async function requestBuyerConfirmation() {
    if (isAdmin || !order || requesting || order.status !== "delivering" || order.delivery_arrival_requested_at) return;
    setConfirmOpen(false);
    setRequesting(true);
    setError("");

    if (watch.current != null) {
      navigator.geolocation.clearWatch(watch.current);
      watch.current = null;
    }

    await supabase.rpc("set_courier_tracking", {
      p_order_id: order.id,
      p_enabled: false,
    });

    const { data, error: confirmationError } = await supabase.rpc(
      "request_delivery_confirmation",
      { p_order_id: order.id },
    );

    if (confirmationError) {
      setError(`Gagal meminta persetujuan pembeli: ${confirmationError.message}`);
    } else if (!data) {
      setError("Permintaan tidak bisa dikirim. Status mungkin sudah berubah.");
    } else {
      await loadTasks();
    }

    setTracking(false);
    setRequesting(false);
  }

  useEffect(() => {
    let cancelled = false;
    let interval: number | undefined;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!data.user) {
        location.href = "/courier/login";
        return;
      }

      if (data.user.email?.toLowerCase() === ADMIN_EMAIL) {
        setIsAdmin(true);
        await loadTasks();
        if (!cancelled) interval = window.setInterval(() => void loadTasks(), 5000);
        return;
      }

      const { data: courier } = await supabase
        .from("couriers")
        .select("id,is_active")
        .eq("id", data.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (!courier?.is_active) {
        await supabase.auth.signOut();
        location.href = "/courier/login";
        return;
      }

      await loadTasks();
      if (!cancelled) interval = window.setInterval(() => void loadTasks(), 5000);
    })().catch(() => {
      if (!cancelled) {
        setError("Sesi tidak dapat diverifikasi.");
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      if (interval !== undefined) window.clearInterval(interval);
      if (watch.current != null) navigator.geolocation.clearWatch(watch.current);
    };
  }, []);

  const ready = orders.filter((item) => item.status === "processing");
  const active = orders.filter((item) => item.status === "delivering");
  const shown = tab === "ready" ? ready : active;
  const hasCustomer = order?.customer_lat != null && order?.customer_lng != null;
  const waitingApproval = Boolean(order?.delivery_arrival_requested_at);

  const points: Point[] = order ? [
    {
      lat: REST_LAT,
      lng: REST_LNG,
      label: "Rumah makan",
      emoji: "🏠",
      className: "bg-emerald-500",
    },
    ...(hasCustomer ? [{
      lat: order.customer_lat as number,
      lng: order.customer_lng as number,
      label: "Pelanggan",
      emoji: "📍",
      className: "bg-blue-500",
    }] : []),
    ...(order.courier_lat != null && order.courier_lng != null ? [{
      lat: order.courier_lat,
      lng: order.courier_lng,
      label: tracking ? "Kurir · LIVE" : "Kurir",
      emoji: "🛵",
      className: "bg-orange-500",
    }] : []),
  ] : [];

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-xl">
        <div
          className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-2xl shadow-lg shadow-orange-950/20"
          aria-label="Logo rumah makan"
        >
          🍜
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 text-center shadow-xl">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${isAdmin ? "bg-blue-500/10" : "bg-orange-500/10"} text-4xl`}>🛵</div>
          <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-[10px] font-black ${isAdmin ? "bg-blue-950 text-blue-300" : "bg-orange-950 text-orange-300"}`}>
            {isAdmin ? "MODE ADMIN · PANTAU" : "PANEL KURIR"}
          </div>
          <h1 className="mt-2 text-2xl font-black">Tugas Kurir</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {isAdmin ? "Pantau semua order delivery dan posisi kurir." : "Pesanan delivery untuk akun kurir ini."}
          </p>
        </div>

        {error && <p className="mt-4 rounded-2xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">⚠️ {error}</p>}

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-2">
          <button onClick={() => setTab("ready")} className={`rounded-xl py-3 text-sm font-bold ${tab === "ready" ? "bg-emerald-500 text-zinc-950" : "text-zinc-400"}`}>
            📦 Siap Diambil <span className="ml-1">{ready.length}</span>
          </button>
          <button onClick={() => setTab("active")} className={`rounded-xl py-3 text-sm font-bold ${tab === "active" ? "bg-orange-500 text-zinc-950" : "text-zinc-400"}`}>
            🛵 Sedang Diantar <span className="ml-1">{active.length}</span>
          </button>
        </div>

        <section className="mt-3 rounded-3xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold">{tab === "ready" ? "📦 Order Siap Diambil" : "🛵 Order Aktif"}</h2>
              <p className="text-xs text-zinc-500">Refresh otomatis setiap 5 detik</p>
            </div>
            <span className="rounded-full bg-zinc-950 px-3 py-1 text-xs text-zinc-400">{shown.length}</span>
          </div>

          {loading ? (
            <div className="mt-4 space-y-2">
              {[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-zinc-800/60" />)}
            </div>
          ) : shown.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-3xl">📭</div>
              <p className="mt-2 font-semibold">{tab === "ready" ? "Belum ada order siap diambil." : "Belum ada order yang sedang diantar."}</p>
              <p className="mt-1 text-xs text-zinc-500">Halaman akan mengecek lagi otomatis.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {shown.map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectTask(item)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${order?.id === item.id ? "border-emerald-500 bg-emerald-950/20" : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{item.customer_name}</p>
                      <p className="mt-1 truncate text-xs text-zinc-500">#{item.id.slice(0, 8)} · {item.customer_address}</p>
                    </div>
                    <span className="shrink-0 text-xs text-orange-300">{item.status === "processing" ? "Siap" : "OTW"}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {order && (
          <section className="mt-3 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-xl">
            <div className="border-b border-zinc-800 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Detail Pesanan</p>
                  <h2 className="mt-1 text-xl font-black">{order.customer_name}</h2>
                  <p className="mt-1 text-sm text-zinc-400">{order.customer_phone}</p>
                </div>
                <span className="rounded-full bg-orange-950 px-3 py-1 text-xs font-bold text-orange-300">{order.status === "processing" ? "Siap diambil" : "Sedang diantar"}</span>
              </div>
              <div className="mt-4 rounded-2xl bg-zinc-950 p-4">
                <p className="text-xs text-zinc-500">Alamat pelanggan</p>
                <p className="mt-1 font-semibold">{order.customer_address}</p>
                {order.notes && <p className="mt-2 text-sm text-zinc-400">Catatan: {order.notes}</p>}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-2xl bg-zinc-950 p-3"><p className="text-xs text-zinc-500">Total</p><p className="mt-1 font-bold">Rp {order.total.toLocaleString("id-ID")}</p></div>
                <div className="rounded-2xl bg-zinc-950 p-3"><p className="text-xs text-zinc-500">Jarak</p><p className="mt-1 font-bold">{order.delivery_distance_km != null ? `${Number(order.delivery_distance_km).toFixed(1)} km` : "-"}</p></div>
              </div>
            </div>

            {order.status === "delivering" && <LiveMap points={points} />}

            <div className="p-5">
              {isAdmin ? (
                <div className="rounded-2xl border border-blue-900/50 bg-blue-950/20 p-4 text-center text-sm text-blue-200">
                  🔎 Mode pantau admin — aksi GPS, ambil order, dan konfirmasi hanya tersedia untuk kurir.
                </div>
              ) : order.status === "processing" ? (
                <button onClick={claimTask} disabled={claiming} className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-zinc-950 disabled:opacity-50">
                  {claiming ? "⏳ Mengambil..." : "📦 Ambil Pesanan"}
                </button>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={tracking ? stopTracking : startTracking}
                      disabled={waitingApproval || requesting}
                      className={`rounded-xl py-3 text-sm font-bold ${tracking ? "bg-red-500 text-white" : "bg-emerald-500 text-zinc-950"} disabled:opacity-50`}
                    >
                      {tracking ? "⏹ Hentikan OTW" : "📍 Mulai OTW"}
                    </button>
                    {hasCustomer && (
                      <a href={mapsUrl(order.customer_lat as number, order.customer_lng as number, order.courier_lat, order.courier_lng)} target="_blank" rel="noreferrer" className="rounded-xl border border-zinc-700 py-3 text-center text-sm font-semibold">
                        🧭 Navigasi
                      </a>
                    )}
                  </div>
                  <button onClick={() => setConfirmOpen(true)} disabled={waitingApproval || requesting} className="mt-3 w-full rounded-xl bg-blue-500 py-3 text-sm font-bold disabled:opacity-50">
                    {requesting ? "⏳ Mengirim..." : waitingApproval ? "⏳ Menunggu persetujuan pembeli" : "🤝 Minta Persetujuan Pembeli"}
                  </button>
                </>
              )}

              <div className="mt-3 rounded-xl bg-zinc-950 p-3 text-xs text-zinc-500">
                {order.courier_updated_at ? `GPS terakhir: ${new Date(order.courier_updated_at).toLocaleTimeString("id-ID")}` : "GPS kurir belum tersedia"}
              </div>
            </div>
          </section>
        )}
      </div>

      {confirmOpen && order && !isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm md:items-center">
          <div className="w-full max-w-md rounded-3xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl">
            <div className="text-3xl">🤝</div>
            <h2 className="mt-2 text-xl font-black">Pesanan sudah sampai?</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Kirim permintaan ke pembeli agar pembeli mengonfirmasi bahwa pesanan sudah diterima. Pesanan delivery tidak akan selesai sebelum pembeli mengonfirmasi.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={() => setConfirmOpen(false)} className="rounded-xl border border-zinc-700 py-3 font-semibold">Batal</button>
              <button onClick={requestBuyerConfirmation} className="rounded-xl bg-blue-500 py-3 font-bold text-zinc-950">Ya, minta konfirmasi</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
