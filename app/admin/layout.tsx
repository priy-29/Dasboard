import type { ReactNode } from "react";
import AdminBottomNav from "../../components/AdminBottomNav";
import AdminNotificationBell from "../../components/AdminNotificationBell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="admin-shell">
    {children}
    <AdminNotificationBell/>
    <AdminBottomNav/>
    <style>{`
      .admin-shell{min-height:100dvh;background:radial-gradient(circle at 85% 0%,rgba(16,185,129,.12),transparent 30%),radial-gradient(circle at 8% 22%,rgba(59,130,246,.07),transparent 28%),#09090b}
      .admin-shell main{background:transparent!important}
      .admin-shell section{border-color:rgba(63,63,70,.7)!important;background:rgba(24,24,27,.82)!important;box-shadow:0 16px 45px rgba(0,0,0,.16);backdrop-filter:blur(12px)}
      .admin-shell article{border-color:rgba(63,63,70,.65)!important;background:rgba(9,9,11,.58);transition:transform .18s ease,border-color .18s ease,background .18s ease,box-shadow .18s ease}
      .admin-shell article:hover{transform:translateY(-2px);border-color:rgba(16,185,129,.38)!important;background:rgba(24,24,27,.9);box-shadow:0 12px 32px rgba(0,0,0,.24)}
      .admin-shell button,.admin-shell a{transition:transform .16s ease,opacity .16s ease,border-color .16s ease,background .16s ease}
      .admin-shell button:not(:disabled):hover,.admin-shell a:hover{transform:translateY(-1px)}
      .admin-shell button:active,.admin-shell a:active{transform:scale(.98)}
      .admin-shell h1{letter-spacing:-.04em}
      .admin-shell input,.admin-shell select{box-shadow:inset 0 1px 0 rgba(255,255,255,.035)}
      .admin-shell select{cursor:pointer}
      .admin-shell .admin-bottom-nav{display:none}
      .admin-shell header .relative.rounded-xl.border{display:none!important}
      @media(max-width:1023px){
        .admin-shell{padding-bottom:0}
        .admin-shell main{padding-left:0!important;padding-right:0!important;padding-bottom:0!important}
        .admin-shell main>div>div{padding-bottom:86px!important}
        .admin-shell header{position:relative!important;top:auto!important;padding:12px 14px!important;padding-right:66px!important}
        .admin-shell header>div:first-child>div:first-child>button{display:none!important}
        .admin-shell header>div.mt-3{display:none!important}
        .admin-shell section{border-radius:22px!important}
        .admin-shell article{border-radius:18px!important}
        .admin-shell .admin-bottom-nav{display:block}
      }
      @media(min-width:1024px){.admin-shell header{padding-right:72px!important}}
    `}</style>
  </div>;
}
