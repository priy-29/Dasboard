"use client";
import { usePathname } from "next/navigation";
import { Home, History, Menu, MapPin, ShoppingBag, Phone } from "lucide-react";

const links = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/menu", label: "Menu", icon: Menu },
  { href: "/riwayat", label: "Riwayat", icon: History },
];
const wa = "6281234567890";

export default function PublicNav() {
  const pathname = usePathname();
  const active = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);
  return <nav aria-label="Navigasi pelanggan">
    <div className="fixed left-0 top-0 z-40 hidden h-screen w-[230px] border-r border-zinc-200/80 bg-white/90 p-5 shadow-[8px_0_40px_rgba(0,0,0,.04)] backdrop-blur-xl lg:flex lg:flex-col">
      <a href="/" className="flex items-center gap-3 px-2 py-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500 text-white"><ShoppingBag size={21}/></span><span><b className="block text-sm">Rumah Makan</b><small className="text-[10px] uppercase tracking-[.18em] text-zinc-400">Kita</small></span></a>
      <div className="mt-10 space-y-2">{links.map(({href,label,icon:Icon}) => <a key={href} href={href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold ${active(href)?"bg-emerald-50 text-emerald-700":"text-zinc-500 hover:bg-zinc-50"}`}><Icon size={18}/>{label}</a>)}</div>
      <div className="mt-auto space-y-2"><a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-700"><Phone size={17}/><span><b className="block">WhatsApp</b>Hubungi kami</span></a><a href="https://www.google.com/maps/search/?api=1&query=-7.396963,109.199585" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600"><MapPin size={17} className="text-emerald-500"/><span><b className="block text-zinc-800">Lokasi rumah makan</b>Lihat di Maps</span></a></div>
    </div>
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/95 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(0,0,0,.08)] backdrop-blur-xl lg:hidden"><div className="mx-auto grid max-w-md grid-cols-3 gap-1">{links.map(({href,label,icon:Icon}) => <a key={href} href={href} className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-bold ${active(href)?"text-emerald-600":"text-zinc-400"}`}><Icon size={20}/>{label}</a>)}</div></div>
  </nav>;
}
