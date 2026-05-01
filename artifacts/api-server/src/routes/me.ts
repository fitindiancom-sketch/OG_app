import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { query, queryOne } from "../lib/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

// Local disk storage for photos
const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Serve uploaded files statically
router.use("/uploads", (req: Request, res: Response) => {
  const safePath = path.normalize(req.path).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(UPLOADS_DIR, safePath);
  if (!filePath.startsWith(UPLOADS_DIR) || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }
  res.sendFile(filePath);
});

router.use(requireAuth);

router.get("/me", async (req: Request, res: Response) => {
  const row = await queryOne(
    `SELECT id, client_code, name, email, phone, city, status, plan_start_date, plan_end_date, created_at
     FROM clients WHERE id = $1`,
    [req.auth!.clientId]
  );
  if (!row) return res.status(404).json({ error: "Client not found" });
  return res.json(row);
});

router.get("/me/diet-plan", async (_req: Request, res: Response) => {
  return res.json({ plan: null, meals: [], sections: [] });
});

router.post("/me/start-plan", async (req: Request, res: Response) => {
  const clientId = req.auth!.clientId;
  const today = new Date().toISOString().slice(0, 10);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);
  const end = endDate.toISOString().slice(0, 10);
  await query(
    "UPDATE clients SET plan_start_date = $1, plan_end_date = $2, status = 'active' WHERE id = $3",
    [today, end, clientId]
  );
  return res.json({ start_date: today, end_date: end, status: "active" });
});

router.post(
  "/me/photos",
  upload.single("photo"),
  async (req: Request, res: Response) => {
    try {
      const clientId = req.auth!.clientId;
      const file = (req as unknown as { file?: Express.Multer.File }).file;
      if (!file) return res.status(400).json({ error: "photo file required" });

      const meal_type = (req.body?.meal_type as string) || "other";
      const remarks = (req.body?.remarks as string) || null;
      const day_number = req.body?.day_number
        ? parseInt(String(req.body.day_number), 10)
        : null;
      const diet_plan_id = (req.body?.diet_plan_id as string) || null;

      const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
      const proto = req.headers["x-forwarded-proto"] || "https";
      const photo_url = `${proto}://${host}/api/uploads/${file.filename}`;

      const row = await queryOne(
        `INSERT INTO photos (client_id, photo_url, meal_type, remarks, day_number, diet_plan_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, photo_url, meal_type, remarks, day_number, uploaded_at`,
        [clientId, photo_url, meal_type, remarks, day_number, diet_plan_id]
      );

      return res.status(201).json(row);
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }
);

router.get("/me/photos", async (req: Request, res: Response) => {
  const clientId = req.auth!.clientId;
  const day = req.query.day ? Number(req.query.day) : null;

  let rows;
  if (day) {
    rows = await query(
      `SELECT id, photo_url, meal_type, remarks, day_number, uploaded_at
       FROM photos WHERE client_id = $1 AND day_number = $2 ORDER BY uploaded_at DESC`,
      [clientId, day]
    );
  } else {
    rows = await query(
      `SELECT id, photo_url, meal_type, remarks, day_number, uploaded_at
       FROM photos WHERE client_id = $1 ORDER BY uploaded_at DESC`,
      [clientId]
    );
  }
  return res.json(rows);
});

router.get("/me/photos/:id/comments", async (req: Request, res: Response) => {
  const rows = await query(
    `SELECT id, comment, created_at, read_at, staff_id
     FROM photo_comments WHERE photo_id = $1 ORDER BY created_at ASC`,
    [req.params.id]
  );
  return res.json(rows);
});

router.post("/me/water-logs", async (req: Request, res: Response) => {
  const clientId = req.auth!.clientId;
  const { liters, log_date } = req.body ?? {};
  if (liters == null) return res.status(400).json({ error: "liters required" });
  const row = await queryOne(
    `INSERT INTO water_logs (client_id, liters, log_date) VALUES ($1, $2, $3) RETURNING *`,
    [clientId, liters, log_date ?? new Date().toISOString().slice(0, 10)]
  );
  return res.status(201).json(row);
});

router.get("/me/water-logs", async (req: Request, res: Response) => {
  const clientId = req.auth!.clientId;
  const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
  const rows = await query(
    `SELECT * FROM water_logs WHERE client_id = $1 AND log_date = $2 ORDER BY created_at DESC`,
    [clientId, date]
  );
  return res.json(rows);
});

router.post("/me/progress-logs", async (req: Request, res: Response) => {
  const clientId = req.auth!.clientId;
  const { weight_kg, notes } = req.body ?? {};
  const row = await queryOne(
    `INSERT INTO progress_logs (client_id, weight_kg, notes) VALUES ($1, $2, $3) RETURNING *`,
    [clientId, weight_kg ?? null, notes ?? null]
  );
  return res.status(201).json(row);
});

router.get("/me/progress-logs", async (req: Request, res: Response) => {
  const clientId = req.auth!.clientId;
  const rows = await query(
    `SELECT * FROM progress_logs WHERE client_id = $1 ORDER BY created_at DESC`,
    [clientId]
  );
  return res.json(rows);
});

router.post("/me/device-tokens", async (req: Request, res: Response) => {
  const clientId = req.auth!.clientId;
  const { expo_push_token, platform } = req.body ?? {};
  if (!expo_push_token) {
    return res.status(400).json({ error: "expo_push_token required" });
  }
  const row = await queryOne(
    `INSERT INTO device_tokens (client_id, expo_push_token, platform)
     VALUES ($1, $2, $3)
     ON CONFLICT (client_id, expo_push_token) DO UPDATE SET platform = EXCLUDED.platform
     RETURNING *`,
    [clientId, expo_push_token, platform ?? null]
  );
  return res.status(201).json(row);
});

export default router;
