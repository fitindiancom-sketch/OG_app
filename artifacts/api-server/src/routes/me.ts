import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { supabase, SUPABASE_BUCKET, SUPABASE_URL } from "../lib/supabase";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.use(requireAuth);

// Current client profile
router.get("/me", async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, client_code, name, email, phone, city, status, plan_start_date, plan_end_date, created_at",
    )
    .eq("id", req.auth!.clientId)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  return res.json(data);
});

// Active diet plan with meals + sections
router.get("/me/diet-plan", async (req: Request, res: Response) => {
  const clientId = req.auth!.clientId;
  const { data: plans, error } = await supabase
    .from("diet_plans")
    .select(
      "id, plan_code, plan_name, status, goal_weight_kg, water_goal_l, start_date, end_date, created_at",
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) return res.status(500).json({ error: error.message });

  const plan = plans?.[0] ?? null;
  if (!plan) return res.json({ plan: null, meals: [], sections: [] });

  const [{ data: meals }, { data: sections }] = await Promise.all([
    supabase
      .from("diet_plan_meals")
      .select("id, meal_type, content, order_index")
      .eq("diet_plan_id", plan.id)
      .order("order_index", { ascending: true }),
    supabase
      .from("diet_plan_sections")
      .select("id, section_type, content")
      .eq("diet_plan_id", plan.id),
  ]);

  return res.json({
    plan,
    meals: meals ?? [],
    sections: sections ?? [],
  });
});

// Mark plan as started
router.post("/me/start-plan", async (req: Request, res: Response) => {
  const clientId = req.auth!.clientId;
  const today = new Date().toISOString().slice(0, 10);

  const { data: plans } = await supabase
    .from("diet_plans")
    .select("id")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1);
  const planId = plans?.[0]?.id;
  if (!planId) return res.status(404).json({ error: "No plan assigned" });

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  const { data, error } = await supabase
    .from("diet_plans")
    .update({
      start_date: today,
      end_date: endDate.toISOString().slice(0, 10),
      status: "active",
    })
    .eq("id", planId)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  await supabase
    .from("clients")
    .update({ plan_start_date: today, plan_end_date: endDate.toISOString().slice(0, 10) })
    .eq("id", clientId);

  return res.json(data);
});

// Photo upload (multipart) → Supabase Storage → photos row
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

      const ext = (file.originalname.split(".").pop() || "jpg").toLowerCase();
      const key = `${clientId}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(key, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });
      if (upErr) return res.status(500).json({ error: upErr.message });

      const photo_url = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${key}`;

      const { data, error } = await supabase
        .from("photos")
        .insert({
          client_id: clientId,
          photo_url,
          meal_type,
          remarks,
          day_number,
          diet_plan_id,
        })
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });

      return res.status(201).json(data);
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  },
);

router.get("/me/photos", async (req: Request, res: Response) => {
  const clientId = req.auth!.clientId;
  const day = req.query.day ? Number(req.query.day) : null;

  let q = supabase
    .from("photos")
    .select("id, photo_url, meal_type, remarks, day_number, uploaded_at")
    .eq("client_id", clientId)
    .order("uploaded_at", { ascending: false });
  if (day) q = q.eq("day_number", day);

  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data ?? []);
});

router.get("/me/photos/:id/comments", async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("photo_comments")
    .select("id, comment, created_at, read_at, staff_id")
    .eq("photo_id", req.params.id)
    .order("created_at", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data ?? []);
});

// Water logs
router.post("/me/water-logs", async (req: Request, res: Response) => {
  const clientId = req.auth!.clientId;
  const { liters, log_date } = req.body ?? {};
  if (liters == null) return res.status(400).json({ error: "liters required" });
  const { data, error } = await supabase
    .from("water_logs")
    .insert({
      client_id: clientId,
      liters,
      log_date: log_date ?? new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(data);
});

router.get("/me/water-logs", async (req: Request, res: Response) => {
  const clientId = req.auth!.clientId;
  const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("water_logs")
    .select("*")
    .eq("client_id", clientId)
    .eq("log_date", date)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data ?? []);
});

// Progress logs (weight)
router.post("/me/progress-logs", async (req: Request, res: Response) => {
  const clientId = req.auth!.clientId;
  const { weight_kg, notes } = req.body ?? {};
  const { data, error } = await supabase
    .from("progress_logs")
    .insert({ client_id: clientId, weight_kg, notes: notes ?? null })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(data);
});

router.get("/me/progress-logs", async (req: Request, res: Response) => {
  const clientId = req.auth!.clientId;
  const { data, error } = await supabase
    .from("progress_logs")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data ?? []);
});

// Device tokens (push notifications)
router.post("/me/device-tokens", async (req: Request, res: Response) => {
  const clientId = req.auth!.clientId;
  const { expo_push_token, platform } = req.body ?? {};
  if (!expo_push_token) {
    return res.status(400).json({ error: "expo_push_token required" });
  }
  const { data, error } = await supabase
    .from("device_tokens")
    .upsert(
      { client_id: clientId, expo_push_token, platform: platform ?? null },
      { onConflict: "client_id,expo_push_token" },
    )
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(data);
});

export default router;
