import { ArrowRight, CheckCircle2, Clock3, MapPin, ShoppingBag, Sparkles, Truck, UtensilsCrossed } from "lucide-react";
import PublicNav from "../components/PublicNav";

export default function Home() {
  return <main className="min-h-screen bg-[#f7f8f6] text-zinc-900 lg:pl-[230px]">
    <PublicNav/>
    <section className="relative overflow-hidden px-5 pb-16 pt-8 md:px-10 md:pt-12 lg:px-16 lg:pt-16">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-200/50 blur-3xl"/>
      <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-amber-100/70 blur-3xl"/>
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm"><Sparkles size={14}/> Masakan rumahan, pesan lebih mudah</span>
          <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.02] tracking-[-.05em] sm:text-5xl lg:text-7xl">Makan enak,<br/><span className="text-emerald-600">nggak perlu ribet.</span></h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-zinc-500 md:text-lg">Selamat datang di Rumah Makan Kita. Pilih menu, tentukan mau diantar atau ambil sendiri, lalu pantau pesananmu sampai selesai.</p>
          <div className="mt-8 flex flex-wrap gap-3"><a href="/menu" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-emerald-500/20 hover:bg-emerald-600">Lihat Menu <ArrowRight size={18}/></a><a href="#tentang" className="rounded-2xl border border-zinc-200 bg-white px-6 py-3.5 text-sm font-bold text-zinc-700 hover:bg-zinc-50">Tentang kami</a></div>
          <div className="mt-9 flex flex-wrap gap-5 text-xs font-semibold text-zinc-500"><span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500"/> Pesanan online</span><span className="flex items-center gap-2"><Truck size={16} className="text-emerald-500"/> Bisa diantar</span><span className="flex items-center gap-2"><UtensilsCrossed size={16} className="text-emerald-500"/> Ambil sendiri</span></div>
        </div>
        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute inset-5 rounded-[40px] bg-emerald-500/10 blur-2xl"/>
          <div className="relative overflow-hidden rounded-[34px] border border-white bg-white p-4 shadow-2xl shadow-zinc-300/40">
            <div className="rounded-[26px] bg-gradient-to-br from-emerald-500 to-emerald-700 p-7 text-white"><div className="flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15"><ShoppingBag/></span><span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold">OPEN</span></div><p className="mt-14 text-sm text-emerald-100">Rumah Makan</p><h2 className="mt-1 text-3xl font-black">Kita</h2><p className="mt-3 max-w-[230px] text-sm leading-6 text-emerald-50/80">Menu pilihan untuk makan hari ini.</p></div>
            <div className="grid grid-cols-2 gap-3 p-2 pt-4"><div className="rounded-2xl bg-zinc-50 p-4"><Clock3 size={17} className="text-emerald-500"/><p className="mt-2 text-xs font-bold">Status pesanan</p><p className="mt-1 text-[10px] text-zinc-400">Pantau otomatis</p></div><div className="rounded-2xl bg-zinc-50 p-4"><MapPin size={17} className="text-emerald-500"/><p className="mt-2 text-xs font-bold">Lokasi</p><p className="mt-1 text-[10px] text-zinc-400">Lihat di Maps</p></div></div>
          </div>
        </div>
      </div>
    </section>

    <section id="tentang" className="border-y border-zinc-200 bg-white px-5 py-16 md:px-10 lg:px-16"><div className="mx-auto max-w-6xl"><div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-600">Kenapa di sini?</p><h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Semua dibuat supaya pelanggan nyaman.</h2></div><div className="mt-10 grid gap-4 md:grid-cols-3"><Feature icon={<UtensilsCrossed/>} title="Menu jelas" text="Lihat menu, harga, kategori, dan pilihan yang tersedia sebelum memesan."/><Feature icon={<Truck/>} title="Pengantaran terukur" text="Untuk delivery, lokasi pelanggan dipakai menghitung jarak dan ongkir."/><Feature icon={<Clock3/>} title="Pantau pesanan" text="Setelah pesan, buka Riwayat untuk melihat perkembangan pesanan."/></div></div></section>

    <section className="px-5 py-16 md:px-10 lg:px-16"><div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[.9fr_1.1fr]"><div className="rounded-[30px] bg-zinc-900 p-7 text-white md:p-9"><p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-400">Cara pesan</p><h2 className="mt-2 text-3xl font-black">3 langkah saja.</h2><div className="mt-8 space-y-5"><Step n="01" title="Pilih menu" text="Masukkan makanan yang kamu mau ke keranjang."/><Step n="02" title="Tentukan pengambilan" text="Pilih diantar atau ambil sendiri di rumah makan."/><Step n="03" title="Pantau" text="Simpan nomor pesanan dan cek status kapan saja."/></div></div><div id="lokasi" className="rounded-[30px] border border-zinc-200 bg-white p-7 shadow-sm md:p-9"><div className="flex items-start justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-600">Temukan kami</p><h2 className="mt-2 text-3xl font-black">Lokasi rumah makan</h2><p className="mt-3 max-w-md text-sm leading-6 text-zinc-500">Buka peta untuk melihat posisi rumah makan dan mendapatkan rute perjalanan.</p></div><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><MapPin/></span></div><div className="mt-8 flex min-h-44 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-50 to-zinc-100"><div className="text-center"><MapPin size={36} className="mx-auto text-emerald-500"/><p className="mt-2 text-sm font-bold">Lokasi tersedia di Google Maps</p><a href="https://www.google.com/maps/search/?api=1&query=-7.396963,109.199585" target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white">Buka Google Maps</a></div></div></div></div></section>

    <footer className="border-t border-zinc-200 bg-white px-5 py-8 text-center text-xs text-zinc-400">© 2026 Rumah Makan Kita · Pesan makanan dengan lebih mudah.</footer>
  </main>;
}

function Feature({icon,title,text}:{icon:React.ReactNode;title:string;text:string}) { return <div className="rounded-3xl border border-zinc-200 bg-[#fafbf9] p-6"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">{icon}</span><h3 className="mt-5 font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-500">{text}</p></div> }
function Step({n,title,text}:{n:string;title:string;text:string}) { return <div className="flex gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-xs font-black text-emerald-300">{n}</span><div><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm leading-6 text-zinc-400">{text}</p></div></div> }
