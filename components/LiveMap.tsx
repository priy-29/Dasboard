"use client";

import { useEffect, useMemo, useState } from "react";

type Point = { lat:number; lng:number; label:string; emoji:string; className:string };
const TILE_SIZE=256;
const world=(lat:number,lng:number,z:number)=>{const s=Math.pow(2,z);const x=(lng+180)/360*s;const y=(1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*s;return{x:x*TILE_SIZE,y:y*TILE_SIZE};};

function RouteLine({points,center,zoom}:{points:Point[];center:{lat:number;lng:number};zoom:number}){
 const [route,setRoute]=useState<[number,number][]>([]);
 const routeKey=points.map(p=>`${p.lat},${p.lng}`).join(";");
 useEffect(()=>{let cancelled=false; const valid=points.filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng)); if(valid.length<2){setRoute([]);return;}
  const start=valid[0],end=valid[valid.length-1];
  const url=`https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=false`;
  fetch(url).then(r=>r.ok?r.json():null).then(data=>{if(!cancelled){const coords=data?.routes?.[0]?.geometry?.coordinates;if(Array.isArray(coords))setRoute(coords);}}).catch(()=>{if(!cancelled)setRoute([]);});
  return()=>{cancelled=true};
 },[routeKey]);
 if(route.length<2)return null;
 const c=world(center.lat,center.lng,zoom);
 const pts=route.map(([lng,lat])=>{const q=world(lat,lng,zoom);return `${500+(q.x-c.x)*1000/500},${250+(q.y-c.y)*500/250}`}).join(" ");
 return <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000 500" preserveAspectRatio="none"><polyline points={pts} fill="none" stroke="white" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity="0.95"/><polyline points={pts} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"/></svg>;
}

export default function LiveMap({points,zoom=15}:{points:Point[];zoom?:number}){
 const center=useMemo(()=>{const p=points.filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lng));if(!p.length)return{lat:-7.396963,lng:109.199585};return{lat:p.reduce((a,x)=>a+x.lat,0)/p.length,lng:p.reduce((a,x)=>a+x.lng,0)/p.length};},[points]);
 const c=world(center.lat,center.lng,zoom);const n=Math.pow(2,zoom);const tx=Math.floor(c.x/TILE_SIZE),ty=Math.floor(c.y/TILE_SIZE);const tiles=[] as {x:number;y:number}[];for(let y=ty-2;y<=ty+2;y++)for(let x=tx-2;x<=tx+2;x++)tiles.push({x:((x%n)+n)%n,y});
 return <div className="relative h-72 w-full overflow-hidden bg-zinc-800">{tiles.map((t,i)=><img key={i} src={`https://tile.openstreetmap.org/${zoom}/${t.x}/${t.y}.png`} alt="" className="absolute h-64 w-64 max-w-none select-none" style={{left:`calc(50% + ${t.x*TILE_SIZE-c.x}px)`,top:`calc(50% + ${t.y*TILE_SIZE-c.y}px)`}} draggable={false}/>)}<RouteLine points={points} center={center} zoom={zoom}/>{points.map((p,i)=>{const q=world(p.lat,p.lng,zoom);return <div key={i} className="absolute -translate-x-1/2 -translate-y-full text-center" style={{left:`calc(50% + ${q.x-c.x}px)`,top:`calc(50% + ${q.y-c.y}px)`}}><div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-lg shadow-xl ${p.className}`}>{p.emoji}</div><span className="mt-1 inline-block whitespace-nowrap rounded-md bg-zinc-950/90 px-2 py-1 text-[10px] font-semibold text-white shadow">{p.label}</span></div>})}<div className="absolute bottom-2 right-2 rounded bg-white/90 px-2 py-1 text-[9px] text-zinc-700">© OpenStreetMap contributors</div></div>;
}
