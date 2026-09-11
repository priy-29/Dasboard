"use client";

import { useEffect, useRef, useState } from "react";
import LiveMap from "../../components/LiveMap";
import { supabase } from "../../lib/supabase";

const REST_LAT = -7.396963;
const REST_LNG = 109.199585;

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
};

function mapsUrl(
  lat: number,
  lng: number,
  originLat?: number | null,
  originLng?: number | null,
) {
  const origin =
    originLat != null && originLng != null
      ? `${originLat},${originLng}`
      : `${REST_LAT},${REST_LNG}`;

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${lat},${lng}&travelmode=driving`;
}

export default function CourierPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const watch = useRef<number | null>(null);

  async function loadTasks() {
    const { data, error: rpcError } = await supabase.rpc("get_courier_tasks");

    if (rpcError) {
      setError(`Gagal mengambil tugas kurir: ${rpcError.message}`);
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
  }

  async function sendLocation(orderId: string, lat: number, lng: number) {
    const { error: rpcError } = await supabase.rpc("update_courier_location", {
      p_order_id: orderId,
      p_lat: lat,
      p_lng: lng,
    });

    if (rpcError) {
      setError(`Gagal mengirim GPS: ${rpcError.message}`);
      return;
    }

    setOrder((current) =>
      current && current.id === orderId
        ? {
            ...current,
            courier_lat: lat,
            courier_lng: lng,
            courier_updated_at: new Date().toISOString(),
            courier_tracking: true,
          }
        : current,
    );
  }

  async function startTracking() {
    if (!order) return;

    if (!navigator.geolocation) {
      setError("Browser ini tidak mendukung GPS.");
      return;
    }

    setError("");

    const orderId = order.id;
    const { error: trackingError } = await supabase.rpc(
      "set_courier_tracking",
      {
        p_order_id: orderId,
        p_enabled: true,
      },
    );

    if (trackingError) {
      setError(`Gagal mengaktifkan tracking: ${trackingError.message}`);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setTracking(true);
        void sendLocation(orderId, lat, lng);

        watch.current = navigator.geolocation.watchPosition(
          (nextPosition) => {
            void sendLocation(
              orderId,
              nextPosition.coords.latitude,
              nextPosition.coords.longitude,
            );
          },
          (gpsError) => {
            setError(`GPS: ${gpsError.message}`);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 3000,
            timeout: 10000,
          },
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
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      },
    );
  }

  async function stopTracking() {
    if (!order) return;

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

  useEffect(() => {
    void loadTasks();

    const timer = window.setInterval(() => {
      void loadTasks();
    }, 5000);

    return () => {
      window.clearInterval(timer);

      if (watch.current != null) {
        navigator.geolocation.clearWatch(watch.current);
      }
    };
  }, []);

  const points = order
    ? [
        {
          lat: REST_LAT,
          lng: REST_LNG,
          label: "Rumah makan",
          emoji: "🏠",
          className: "bg-emerald-500",
        },
        ...(order.customer_lat != null && order.customer_lng != null
          ? [
              {
                lat: order.customer_lat,
                lng: order.customer_lng,
                label: "Pelanggan",
                emoji: "📍",
                className: "bg-blue-500",
              },
            ]
          : []),
        ...(order.courier_lat != null && order.courier_lng != null
          ? [
              {
                lat: order.courier_lat,
                lng: order.courier_lng,
                label: tracking ? "Kurir · LIVE" : "Kurir",
                emoji: "🛵",
                className: "bg-orange-500",
              },
            ]
          : []),
      ]
    : [];

  const hasCustomer =
    order?.customer_lat != null && order?.customer_lng != null;

  const navigationUrl = hasCustomer
    ? mapsUrl(
        order!.customer_lat!,
        order!.customer_lng!,
        order!.courier_lat,
        order!.courier_lng,
      )
    : "";

  return (
    <main className="min-h-screen bg-zinc-950 p-5 text-white">
      <div className="mx-auto max-w-lg">
        <button
          onClick={() => (location.href = "/admin")}
          className="mb-6 text-sm text-zinc-500"
        >
          ← Dashboard
        </button>

        <div className="text-center">
          <div className="text-5xl">🛵</div>
          <h1 className="mt-3 text-2xl font-bold">Tugas Kurir</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Pesanan yang admin ubah menjadi{" "}
            <b className="text-orange-400">Diantar</b> muncul otomatis di sini.
          </p>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold">📦 Siap diantar</h2>
              <p className="text-xs text-zinc-500">Refresh otomatis setiap 5 detik</p>
            </div>
            <span className="rounded-full bg-orange-950 px-3 py-1 text-xs font-semibold text-orange-300">
              {orders.length} tugas
            </span>
          </div>

          {loading ? (
            <p className="py-8 text-center text-zinc-500">Mencari tugas...</p>
          ) : orders.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-zinc-400">Belum ada pesanan untuk diantar.</p>
              <p className="mt-1 text-xs text-zinc-600">
                Admin tinggal pilih status <b>Diantar</b> pada pesanan.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {orders.map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectTask(item)}
                  className={`w-full rounded-2xl border p-4 text-left ${
                    order?.id === item.id
                      ? "border-emerald-500 bg-emerald-950/20"
                      : "border-zinc-800 bg-zinc-950"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{item.customer_name}</p>
                      <p className="mt-1 truncate text-xs text-zinc-500">
                        #{item.id.slice(0, 8)} · {item.customer_address}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-orange-300">
                      {item.courier_tracking ? "● LIVE" : "🚚 Diantar"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
                    <span className="rounded-full bg-zinc-900 px-2 py-1">
                      💰 Rp {item.total.toLocaleString("id-ID")}
                    </span>
                    {item.delivery_distance_km != null && (
                      <span className="rounded-full bg-zinc-900 px-2 py-1">
                        📍 {Number(item.delivery_distance_km).toFixed(1)} km
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {order && (
          <section className="mt-5 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-emerald-400">
                    Tugas aktif · #{order.id.slice(0, 8)}
                  </p>
                  <h2 className="mt-1 text-xl font-bold">
                    Antar ke {order.customer_name}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    {order.customer_address}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    {order.customer_phone} · {order.payment_method.toUpperCase()}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    tracking
                      ? "bg-emerald-500 text-zinc-950"
                      : "bg-orange-950 text-orange-300"
                  }`}
                >
                  {tracking ? "● GPS LIVE" : "GPS BELUM AKTIF"}
                </span>
              </div>

              <div className="mt-4 rounded-2xl border border-orange-900/50 bg-orange-950/20 p-3 text-xs text-orange-200">
                {tracking
                  ? "📍 GPS asli HP kurir sedang dikirim ke server."
                  : "📍 Tekan Mulai OTW untuk meminta izin lokasi dan memakai koordinat GPS asli HP kurir."}
              </div>
            </div>

            <LiveMap points={points} />

            <div className="p-5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={tracking ? stopTracking : startTracking}
                  className={`rounded-xl py-3 text-sm font-bold ${
                    tracking
                      ? "bg-red-500 text-white"
                      : "bg-emerald-500 text-zinc-950"
                  }`}
                >
                  {tracking ? "⏹ Hentikan OTW" : "📍 Izinkan GPS & Mulai OTW"}
                </button>

                {hasCustomer && (
                  <a
                    href={navigationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-zinc-700 py-3 text-center text-sm font-semibold"
                  >
                    🧭 Navigasi
                  </a>
                )}
              </div>

              <div className="mt-3 rounded-xl bg-zinc-950 p-3 text-xs text-zinc-500">
                {order.courier_updated_at
                  ? `GPS terakhir: ${new Date(order.courier_updated_at).toLocaleTimeString("id-ID")}`
                  : "GPS kurir belum tersedia"}
                {" · Posisi diperbarui otomatis."}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
