import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "maspri2904@gmail.com";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const secretKey = process.env.SUPABASE_SECRET_KEY!;

async function adminClients(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const userClient = createClient(url, publicKey, { auth: { persistSession: false } });
  const { data, error } = await userClient.auth.getUser(token);
  if (error || data.user?.email?.toLowerCase() !== ADMIN_EMAIL) return null;
  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return { admin };
}

export async function GET(req: Request) {
  const clients = await adminClients(req);
  if (!clients) return NextResponse.json({ error: "Tidak berwenang" }, { status: 401 });
  const { data, error } = await clients.admin.from("couriers").select("id,name,phone,is_active,created_at,updated_at").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ couriers: data ?? [] });
}

export async function POST(req: Request) {
  const clients = await adminClients(req);
  if (!clients) return NextResponse.json({ error: "Tidak berwenang" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const phone = String(body?.phone ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  if (name.length < 2 || !email.includes("@") || password.length < 8) return NextResponse.json({ error: "Nama, email valid, dan password minimal 8 karakter wajib diisi." }, { status: 400 });

  const { data: created, error: createError } = await clients.admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { name, role: "courier" }
  });
  if (createError || !created.user) return NextResponse.json({ error: createError?.message ?? "Gagal membuat akun." }, { status: 400 });

  const { error: rowError } = await clients.admin.from("couriers").insert({ id: created.user.id, name, phone: phone || null, is_active: true });
  if (rowError) {
    await clients.admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: rowError.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, courier: { id: created.user.id, name, phone, is_active: true } });
}

export async function PATCH(req: Request) {
  const clients = await adminClients(req);
  if (!clients) return NextResponse.json({ error: "Tidak berwenang" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const id = String(body?.id ?? "");
  const isActive = Boolean(body?.is_active);
  if (!id) return NextResponse.json({ error: "ID kurir tidak valid." }, { status: 400 });
  const { error } = await clients.admin.from("couriers").update({ is_active: isActive, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const clients = await adminClients(req);
  if (!clients) return NextResponse.json({ error: "Tidak berwenang" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const id = String(body?.id ?? "");
  if (!id) return NextResponse.json({ error: "ID kurir tidak valid." }, { status: 400 });
  const { data: activeOrders } = await clients.admin.from("orders").select("id").eq("courier_id", id).in("status", ["processing", "delivering"]);
  if ((activeOrders ?? []).length) return NextResponse.json({ error: "Kurir masih memiliki order aktif. Nonaktifkan saja terlebih dahulu." }, { status: 409 });
  const { error: authError } = await clients.admin.auth.admin.deleteUser(id);
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
