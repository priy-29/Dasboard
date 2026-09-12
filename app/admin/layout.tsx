import type { ReactNode } from "react";
import AdminBottomNav from "../../components/AdminBottomNav";
import AdminNotificationBell from "../../components/AdminNotificationBell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="admin-shell">
    {children}
    <AdminNotificationBell />
    <AdminBottomNav />
    <style>{`
      .admin-shell{min-height:100dvh;background:radial-gradient(900px 520px at 85% -10%,rgba(16,185,129,.13),transparent 60%),radial-gradient(700px 480px at -10% 35%,rgba(59,130,246,.06),transparent 60%),#07090d;color:#f4f4f5;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
      .admin-shell main{background:transparent!important}
      .admin-shell section{border-color:rgba(255,255,255,.075)!important;background:rgba(15,18,23,.86)!important;box-shadow:0 18px 55px rgba(0,0,0,.14);backdrop-filter:blur(18px)}
      .admin-shell article{border-color:rgba(255,255,255,.065)!important;background:rgba(8,10,14,.52);transition:transform .18s ease,border-color .18s ease,background .18s ease,box-shadow .18s ease}
      .admin-shell article:hover{transform:translateY(-2px);border-color:rgba(52,211,153,.28)!important;background:rgba(18,22,27,.82);box-shadow:0 14px 34px rgba(0,0,0,.22)}
      .admin-shell button,.admin-shell a{transition:transform .16s ease,opacity .16s ease,border-color .16s ease,background .16s ease,box-shadow .16s ease}
      .admin-shell button:not(:disabled):hover,.admin-shell a:hover{transform:translateY(-1px)}
      .admin-shell button:active,.admin-shell a:active{transform:scale(.98)}
      .admin-shell button:focus-visible,.admin-shell a:focus-visible,.admin-shell input:focus-visible,.admin-shell select:focus-visible,.admin-shell textarea:focus-visible{outline:2px solid rgba(52,211,153,.65);outline-offset:2px}
      .admin-shell h1{letter-spacing:-.045em;line-height:1.02}
      .admin-shell h2,.admin-shell h3{letter-spacing:-.025em}
      .admin-shell input,.admin-shell select,.admin-shell textarea{border-color:rgba(255,255,255,.08)!important;background:rgba(3,5,8,.62)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 1px 2px rgba(0,0,0,.18)}
      .admin-shell input::placeholder,.admin-shell textarea::placeholder{color:#525862}
      .admin-shell input:focus,.admin-shell select:focus,.admin-shell textarea:focus{border-color:rgba(52,211,153,.48)!important;box-shadow:0 0 0 3px rgba(52,211,153,.07),inset 0 1px 0 rgba(255,255,255,.025)}
      .admin-shell select{cursor:pointer}
      .admin-shell .admin-bottom-nav{display:none}

      /* Shared page chrome for the secondary admin screens. */
      .admin-shell main > div.mx-auto.max-w-6xl,
      .admin-shell main > div.mx-auto.max-w-4xl{padding-top:clamp(22px,4vw,42px)!important}
      .admin-shell main > div.mx-auto.max-w-6xl > header{margin-bottom:24px!important;padding:4px 0 0!important}
      .admin-shell main > div.mx-auto.max-w-6xl > header h1,
      .admin-shell main > div.mx-auto.max-w-4xl h1{font-size:clamp(2.05rem,5vw,3.25rem)!important}
      .admin-shell main > div.mx-auto.max-w-6xl > header p:last-child,
      .admin-shell main > div.mx-auto.max-w-4xl > div > p:last-child{max-width:620px;line-height:1.55}
      .admin-shell main > div.mx-auto.max-w-6xl > div.grid.grid-cols-3{gap:12px!important;margin-bottom:20px!important}
      .admin-shell main > div.mx-auto.max-w-6xl > div.grid.grid-cols-3 > div{min-height:104px;border-radius:22px!important;padding:18px!important;background:linear-gradient(145deg,rgba(22,27,34,.94),rgba(10,13,18,.88))!important}
      .admin-shell main > div.mx-auto.max-w-6xl form,
      .admin-shell main > div.mx-auto.max-w-6xl > section,
      .admin-shell main > div.mx-auto.max-w-4xl form,
      .admin-shell main > div.mx-auto.max-w-4xl aside > div{border-radius:26px!important;background:linear-gradient(145deg,rgba(18,22,28,.96),rgba(10,13,18,.9))!important;box-shadow:0 20px 55px rgba(0,0,0,.18)!important}
      .admin-shell main > div.mx-auto.max-w-6xl form{padding:24px!important}
      .admin-shell main > div.mx-auto.max-w-6xl > section{padding:24px!important}
      .admin-shell main > div.mx-auto.max-w-4xl{max-width:1080px!important}
      .admin-shell main > div.mx-auto.max-w-4xl > div.mb-6{margin-bottom:22px!important;padding:4px 0!important}
      .admin-shell main > div.mx-auto.max-w-4xl > div.grid{gap:16px!important}
      .admin-shell main > div.mx-auto.max-w-4xl form{padding:24px!important}
      .admin-shell main > div.mx-auto.max-w-4xl form > div.rounded-2xl,
      .admin-shell main > div.mx-auto.max-w-4xl form > div.mt-4{border-radius:20px!important;background:rgba(5,7,10,.58)!important}
      .admin-shell main > div.mx-auto.max-w-4xl aside{gap:16px!important}

      @media(max-width:1023px){
        .admin-shell{padding-bottom:0}
        .admin-shell main{padding-left:0!important;padding-right:0!important;padding-bottom:0!important}
        .admin-shell main>div>div{padding-bottom:92px!important}
        .admin-shell header{position:relative!important;top:auto!important}
        .admin-shell section{border-radius:24px!important}
        .admin-shell article{border-radius:20px!important}
        .admin-shell .admin-bottom-nav{display:block}
        .admin-shell .admin-notification-trigger{top:12px!important;right:12px!important;border-radius:16px!important;background:rgba(10,14,19,.86)!important;border-color:rgba(255,255,255,.08)!important;box-shadow:0 10px 30px rgba(0,0,0,.25)!important}
        .admin-shell h1{font-size:clamp(2rem,9vw,2.75rem)!important}
        .admin-shell main > div.mx-auto.max-w-6xl,
        .admin-shell main > div.mx-auto.max-w-4xl{padding:24px 16px 100px!important}
        .admin-shell main > div.mx-auto.max-w-6xl > header{padding:0!important;margin-bottom:22px!important}
        .admin-shell main > div.mx-auto.max-w-6xl > div.grid.grid-cols-3{gap:10px!important}
        .admin-shell main > div.mx-auto.max-w-6xl > div.grid.grid-cols-3 > div{min-height:98px;padding:15px!important}
        .admin-shell main > div.mx-auto.max-w-6xl form,
        .admin-shell main > div.mx-auto.max-w-6xl > section,
        .admin-shell main > div.mx-auto.max-w-4xl form,
        .admin-shell main > div.mx-auto.max-w-4xl aside > div{border-radius:24px!important;padding:20px!important}
        .admin-shell main > div.mx-auto.max-w-4xl > div.mb-6{margin-bottom:20px!important}
        .admin-shell input,.admin-shell select,.admin-shell textarea{font-size:16px!important;min-height:46px}
      }
      @media(min-width:1024px){.admin-shell header{padding-right:72px!important}}
    `}</style>
  </div>;
}
