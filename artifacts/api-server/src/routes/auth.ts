import { Router, type IRouter, type Request, type Response } from "express";
import { supabase } from "../lib/supabase";
import {
  hashPassword,
  verifyPassword,
  signToken,
} from "../lib/auth";

const router: IRouter = Router();

interface ClientRow {
  id: string;
  client_code: string;
  name: string;
  email: string | null;
  phone: string | null;
  password_hash: string | null;
  is_mobile_enabled: boolean | null;
  city: string | null;
  status: string | null;
  plan_start_date: string | null;
  plan_end_date: string | null;
  created_at: string;
}

async function nextClientCode(): Promise<string> {
  const { data } = await supabase
    .from("clients")
    .select("client_code")
    .order("created_at", { ascending: false })
    .limit(1);
  const last = data?.[0]?.client_code as string | undefined;
  if (!last) return "C-1001";
  const num = parseInt(last.replace(/\D/g, ""), 10);
  return Number.isFinite(num) ? `C-${num + 1}` : `C-${Date.now()}`;
}

router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone, city } = req.body ?? {};
    if (!email || !password || !name || !phone) {
      return res
        .status(400)
        .json({ error: "email, password, name, phone are required" });
    }
    const lc = String(email).toLowerCase().trim();

    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("email", lc)
      .limit(1);
    if (existing && existing.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const password_hash = await hashPassword(String(password));
    const client_code = await nextClientCode();

    const { data: inserted, error } = await supabase
      .from("clients")
      .insert({
        client_code,
        name,
        email: lc,
        phone,
        city: city ?? "Not provided",
        password_hash,
        is_mobile_enabled: true,
      })
      .select("id, client_code, name, email, phone, is_mobile_enabled")
      .single();

    if (error || !inserted) {
      return res.status(500).json({ error: error?.message ?? "Insert failed" });
    }

    const token = signToken({ clientId: inserted.id, email: lc });
    return res.status(201).json({ token, client: inserted });
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }
    const lc = String(email).toLowerCase().trim();

    const { data, error } = await supabase
      .from("clients")
      .select(
        "id, client_code, name, email, phone, password_hash, is_mobile_enabled",
      )
      .eq("email", lc)
      .limit(1);

    if (error) return res.status(500).json({ error: error.message });
    const row = (data?.[0] ?? null) as ClientRow | null;
    if (!row || !row.password_hash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (row.is_mobile_enabled === false) {
      return res.status(403).json({ error: "Mobile access disabled" });
    }
    const ok = await verifyPassword(String(password), row.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    await supabase
      .from("clients")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", row.id);

    const token = signToken({ clientId: row.id, email: row.email ?? lc });
    return res.json({
      token,
      client: {
        id: row.id,
        client_code: row.client_code,
        name: row.name,
        email: row.email,
        phone: row.phone,
      },
    });
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
