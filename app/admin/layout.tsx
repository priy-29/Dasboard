import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell">
      {children}
      <style>{`
        .admin-shell{min-height:100vh;background:radial-gradient(circle at 85% 0%,rgba(16,185,129,.12),transparent 30%),radial-gradient(circle at 8% 22%,rgba(59,130,246,.07),transparent 28%),#09090b}
        .admin-shell main{background:transparent!important}
        .admin-shell section{border-color:rgba(63,63,70,.7)!important;background:rgba(24,24,27,.82)!important;box-shadow:0 16px 45px rgba(0,0,0,.16);backdrop-filter:blur(12px)}
        .admin-shell article{border-color:rgba(63,63,70,.65)!important;background:rgba(9,9,11,.58);transition:transform .18s ease,border-color .18s ease,background .18s ease,box-shadow .18s ease}
        .admin-shell article:hover{transform:translateY(-2px);border-color:rgba(16,185,129,.38)!important;background:rgba(24,24,27,.9);box-shadow:0 12px 32px rgba(0,0,0,.24)}
        .admin-shell button,.admin-shell a{transition:transform .16s ease,opacity .16s ease,border-color .16s ease,background .16s ease}
        .admin-shell button:not(:disabled):hover,.admin-shell a:hover{transform:translateY(-1px)}
        .admin-shell button:active,.admin-shell a:active{transform:scale(.98)}
        .admin-shell header{position:relative}
        .admin-shell header:after{content:"";position:absolute;left:0;right:0;bottom:-18px;height:1px;background:linear-gradient(90deg,transparent,rgba(82,82,91,.8),transparent)}
        .admin-shell h1{letter-spacing:-.04em}
        .admin-shell input,.admin-shell select{box-shadow:inset 0 1px 0 rgba(255,255,255,.035)}
        .admin-shell select{cursor:pointer}
        .admin-shell .bg-emerald-500{box-shadow:0 7px 24px rgba(16,185,129,.13)}
        .admin-shell .bg-orange-500{box-shadow:0 7px 24px rgba(249,115,22,.10)}
        @media(max-width:640px){.admin-shell main{padding-left:14px!important;padding-right:14px!important}.admin-shell section{border-radius:22px!important}.admin-shell article{border-radius:18px!important}}
      `}</style>
    </div>
  );
}
