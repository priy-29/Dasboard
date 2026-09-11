"use client";

import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Truck, Navigation } from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Produk", icon: Package },
  { href: "/admin/delivery", label: "Ongkir", icon: Truck },
  { href: "/courier", label: "Kurir", icon: Navigation },
];

export default function AdminBottomNav() {
  const pathname = usePathname();
  return <nav className="admin-bottom-nav fixed bottom-0 left-0 right-0 z-[80] border-t border-white/10 bg-[#0b0f14]/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_35px_rgba(0,0,0,.35)] backdrop-blur-xl lg:hidden"><div className="mx-auto grid max-w-lg grid-cols-4 gap-1">{links.map(({href,label,icon:Icon})=>{const active=href==="/admin"?pathname==="/admin":pathname.startsWith(href);return <a key={href} href={href} className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-bold ${active?"bg-emerald-400/10 text-emerald-300":"text-zinc-500"}`}><Icon size={19}/>{label}</a>})}</div></nav>;
}
