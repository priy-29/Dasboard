"use client";

import { useMemo } from "react";

type Point = { lat:number; lng:number; label:string; emoji:string; className:string };
const TILE_SIZE=256;
const world=(lat:number,lng:number,z:number)=>{const s=Math.pow(2,z);const x=(lng+180)/360*s;const y=(1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*s;return{x:x*TILE_SIZE,y:y*TILE_SIZE};};

export default function LiveMap({points,zoom=15}:{points:Point[];zoom?:number}){
 const center=useMemo(()=>{const p=points.filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lng));if(!p.length)return{lat:-7.396963,lng:109.199585};return{lat:p.reduce((a,x)=>a+x.lat,0)/p.length,lng:p.reduce((a,x)=>a+x.lng,0)/p.length};},[points]);
 const c=world(center.lat,center.lng,zoom);const n=Math.pow(2,zoom);const tx=Math.floor(c.x/TILE_SIZE),ty=Math.floor(c.y/TILE_SIZE);const tiles=[] as {x:number;y:number}[];for(let y=ty-2;y<=ty+2;y++)for(let x=tx-2;x<=tx+2;x++)tiles.push({x:((x%n)+n)%n,y});
 return <div className="relative h-72 w-full overflow-hidden bg-zinc-800">{tiles.map((t,i)=><img key={i} src={`https://tile.openstreetmap.org/${zoom}/${t.x}/${t.y}.png`} alt="" className="absolute h-64 w-64 max-w-none select-none" style={{left:`calc(50% + ${t.x*TILE_SIZE-c.x}px)`,top:`calc(50% + ${t.y*TILE_SIZE-c.y}px)`}} draggable={false}/>)}{points.map((p,i)=>{const q=world(p.lat,p.lng,zoom);const left=50+(q.x-c.x)/TILE_SIZE*100/2.8125;const top=50+(q.y-c.y)/TILE_SIZE*100/2.8125;return <div key={i} className="absolute -translate-x-1/2 -translate-y-full text-center" style={{left:`${left}%`,top:`${top}%`}}><div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-lg shadow-xl ${p.className}`}>{p.emoji}</div><span className="mt-1 inline-block whitespace-nowrap rounded-md bg-zinc-950/90 px-2 py-1 text-[10px] font-semibold text-white shadow">{p.label}</span></div>})}<div className="absolute bottom-2 right-2 rounded bg-white/90 px-2 py-1 text-[9px] text-zinc-700">© OpenStreetMap contributors</div></div>;
}
