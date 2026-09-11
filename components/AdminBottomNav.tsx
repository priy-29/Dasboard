"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Truck, Navigation, Users } from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Produk", icon: Package },
  { href: "/admin/delivery", label: "Ongkir", icon: Truck },
  { href: "/admin/couriers", label: "Kurir", icon: Users },
  { href: "/courier", label: "Panel", icon: Navigation },
];

export default function AdminBottomNav() {
  const pathname = usePathname();
  return <nav aria-label="Navigasi admin" className="admin-bottom-nav fixed bottom-0 left-0 right-0 z-[80] border-t border-white/10 bg-[#090d12]/96 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-16px_40px_rgba(0,0,0,.42)] backdrop-blur-2xl lg:hidden">
    <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return <Link key={href} href={href} className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[9px] font-bold transition ${active ? "bg-emerald-400/10 text-emerald-300" : "text-zinc-500 hover:bg-white/[.03] hover:text-zinc-300"}`}>
          {active && <span className="absolute top-1 h-0.5 w-6 rounded-full bg-emerald-400"/>}
          <Icon size={18} strokeWidth={active ? 2.4 : 2}/><span>{label}</span>
        </Link>;
      })}
    </div>
  </nav>;
}
