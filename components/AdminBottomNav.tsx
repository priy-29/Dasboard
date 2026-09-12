"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Truck, Navigation, Users, ClipboardList } from "lucide-react";

const links = [
  { href: "/admin/pos", label: "Kasir", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Pesanan", icon: ClipboardList },
  { href: "/admin/products", label: "Produk", icon: Package },
  { href: "/admin/delivery", label: "Ongkir", icon: Truck },
  { href: "/admin/couriers", label: "Akun", icon: Users },
  { href: "/courier", label: "Kurir", icon: Navigation },
];

export default function AdminBottomNav() {
  const pathname = usePathname();
  if (pathname === "/admin/login") return null;
  return <nav aria-label="Navigasi admin" className="admin-bottom-nav fixed bottom-0 left-0 right-0 z-[80] overflow-x-auto px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 lg:hidden"><div className="mx-auto grid min-w-[390px] max-w-lg grid-cols-6 gap-1 rounded-[24px] border border-white/[.09] bg-[#0b0f14]/95 p-1.5 shadow-[0_-12px_40px_rgba(0,0,0,.45),0_10px_35px_rgba(0,0,0,.2)] backdrop-blur-2xl">{links.map(({href,label,icon:Icon})=>{const active=href==="/admin/pos"?pathname==="/admin/pos":pathname.startsWith(href);return <Link key={href} href={href} className={`group relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-[18px] px-1 text-[9px] font-bold transition-all ${active?"bg-emerald-400 text-[#06110c] shadow-[0_6px_20px_rgba(52,211,153,.16)]":"text-zinc-500 hover:bg-white/[.05] hover:text-zinc-200"}`}><Icon size={17} strokeWidth={active?2.5:2}/><span className="leading-none">{label}</span></Link>})}</div></nav>;
}
