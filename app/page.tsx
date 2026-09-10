const stats = [
  ["Penjualan Hari Ini", "Rp 2.450.000", "+12,5%"],
  ["Pesanan", "48", "+8 hari ini"],
  ["Pelanggan", "126", "+14 bulan ini"],
  ["Produk Aktif", "32", "4 stok menipis"],
];

const orders = [
  ["#ORD-1048", "Budi Santoso", "Rp 185.000", "Diproses"],
  ["#ORD-1047", "Siti Aminah", "Rp 92.000", "Menunggu"],
  ["#ORD-1046", "Andi Wijaya", "Rp 240.000", "Selesai"],
  ["#ORD-1045", "Rina Putri", "Rp 76.000", "Selesai"],
];

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden min-h-screen w-64 border-r border-zinc-800 bg-zinc-900/60 p-5 md:block">
          <div className="mb-8 text-xl font-bold">Das<span className="text-emerald-400">board</span></div>
          <nav className="space-y-2 text-sm">
            {[["▦", "Dashboard"], ["◫", "Pesanan"], ["☷", "Produk"], ["◉", "Pelanggan"], ["▤", "Transaksi"], ["⚙", "Pengaturan"]].map(([icon, label], i) => (
              <div key={label} className={`flex items-center gap-3 rounded-xl px-3 py-3 ${i === 0 ? "bg-emerald-500/10 text-emerald-400" : "text-zinc-400 hover:bg-zinc-800"}`}>
                <span>{icon}</span>{label}
              </div>
            ))}
          </nav>
        </aside>

        <section className="w-full p-5 md:p-8">
          <header className="mb-8 flex items-center justify-between">
            <div><p className="text-sm text-zinc-500">Kamis, 10 September 2026</p><h1 className="mt-1 text-2xl font-bold">Dashboard</h1></div>
            <button className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950">+ Pesanan Baru</button>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map(([title, value, change]) => <div key={title} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-500">{title}</p><p className="mt-2 text-2xl font-bold">{value}</p><p className="mt-2 text-xs text-emerald-400">{change}</p></div>)}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="mb-5 flex justify-between"><div><h2 className="font-semibold">Penjualan</h2><p className="text-xs text-zinc-500">7 hari terakhir</p></div><span className="text-xl font-bold">Rp 14,8 jt</span></div>
              <div className="flex h-48 items-end gap-3 border-b border-zinc-800 px-2">
                {[42, 65, 52, 82, 58, 91, 72].map((h, i) => <div key={i} className="flex-1 rounded-t-lg bg-emerald-500/70" style={{ height: `${h}%` }} />)}
              </div>
              <div className="mt-2 flex justify-between text-xs text-zinc-600">{["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map(x => <span key={x}>{x}</span>)}</div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><h2 className="font-semibold">Status Pesanan</h2><div className="mt-6 space-y-5">{[["Selesai", 31, "64%"], ["Diproses", 10, "21%"], ["Menunggu", 7, "15%"]].map(([x,n,p]) => <div key={x}><div className="mb-2 flex justify-between text-sm"><span>{x}</span><span className="text-zinc-500">{n} · {p}</span></div><div className="h-2 rounded-full bg-zinc-800"><div className="h-2 rounded-full bg-emerald-500" style={{width:p}} /></div></div>)}</div></div>
          </div>

          <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><div className="mb-5 flex items-center justify-between"><h2 className="font-semibold">Pesanan Terbaru</h2><button className="text-sm text-emerald-400">Lihat semua →</button></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-zinc-500"><tr><th className="pb-3">ID</th><th>PELANGGAN</th><th>TOTAL</th><th>STATUS</th></tr></thead><tbody>{orders.map(([id,name,total,status]) => <tr key={id} className="border-t border-zinc-800"><td className="py-4 font-medium">{id}</td><td className="text-zinc-300">{name}</td><td>{total}</td><td><span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">{status}</span></td></tr>)}</tbody></table></div></div>
        </section>
      </div>
    </main>
  );
}
