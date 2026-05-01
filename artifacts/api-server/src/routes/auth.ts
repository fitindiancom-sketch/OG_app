import { Router, type IRouter, type Request, type Response } from "express";
import { query, queryOne } from "../lib/db";
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
}

async function nextClientCode(): Promise<string> {
  const row = await queryOne<{ client_code: string }>(
    "SELECT client_code FROM clients ORDER BY created_at DESC LIMIT 1"
  );
  const last = row?.client_code;
  if (!last) return "C-1001";
  const num = parseInt(last.replace(/\D/g, ""), 10);
  return Number.isFinite(num) ? `C-${num + 1}` : `C-${Date.now()}`;
}

router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone, city } = req.body ?? {};
    if (!email || !password || !name || !phone) {
      return res.status(400).json({ error: "email, password, name, phone are required" });
    }
    const lc = String(email).toLowerCase().trim();

    const existing = await queryOne<{ id: string }>(
      "SELECT id FROM clients WHERE email = $1 LIMIT 1",
      [lc]
    );
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const password_hash = await hashPassword(String(password));
    const client_code = await nextClientCode();

    const inserted = await queryOne<ClientRow>(
      `INSERT INTO clients (client_code, name, email, phone, city, password_hash, is_mobile_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING id, client_code, name, email, phone, is_mobile_enabled`,
      [client_code, name, lc, phone, city ?? "Not provided", password_hash]
    );

    if (!inserted) {
      return res.status(500).json({ error: "Insert failed" });
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

    const row = await queryOne<ClientRow>(
      `SELECT id, client_code, name, email, phone, password_hash, is_mobile_enabled
       FROM clients WHERE email = $1 LIMIT 1`,
      [lc]
    );

    if (!row || !row.password_hash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (row.is_mobile_enabled === false) {
      return res.status(403).json({ error: "Mobile access disabled" });
    }

    const ok = await verifyPassword(String(password), row.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    await query("UPDATE clients SET last_login_at = NOW() WHERE id = $1", [row.id]);

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
