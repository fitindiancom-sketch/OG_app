import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const TOKEN_KEY = "auth_token";

function getApiBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}/api`;

  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.host}/api`;
  }
  return "http://localhost:8080/api";
}

export const API_BASE_URL = getApiBaseUrl();

export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setAuthToken(token: string | null): Promise<void> {
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  isFormData?: boolean;
  noAuth?: boolean;
}

export async function apiRequest<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };

  if (!opts.isFormData && opts.body != null) {
    headers["Content-Type"] = "application/json";
  }

  if (!opts.noAuth) {
    const token = await getAuthToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (opts.body != null) {
    if (opts.isFormData) body = opts.body as BodyInit;
    else body = JSON.stringify(opts.body);
  }

  const res = await fetch(url, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    headers,
    body,
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : null) ?? text ?? `HTTP ${res.status}`;
    throw new ApiError(res.status, msg);
  }

  return data as T;
}

// ===== Typed wrappers =====

export interface AuthClient {
  id: string;
  client_code: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface AuthResponse {
  token: string;
  client: AuthClient;
}

export const authApi = {
  register: (input: {
    email: string;
    password: string;
    name: string;
    phone: string;
    city?: string;
  }) =>
    apiRequest<AuthResponse>("/auth/register", { body: input, noAuth: true }),

  login: (input: { email: string; password: string }) =>
    apiRequest<AuthResponse>("/auth/login", { body: input, noAuth: true }),

  me: () =>
    apiRequest<
      AuthClient & {
        city: string | null;
        status: string | null;
        plan_start_date: string | null;
        plan_end_date: string | null;
      }
    >("/me"),
};

export interface DietPlanMeal {
  id: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  content: string;
  order_index: number;
}

export interface DietPlanSection {
  id: string;
  section_type: string;
  content: string;
}

export interface DietPlanResponse {
  plan: {
    id: string;
    plan_code: string;
    plan_name: string;
    status: string;
    goal_weight_kg: number | null;
    water_goal_l: number | null;
    start_date: string | null;
    end_date: string | null;
  } | null;
  meals: DietPlanMeal[];
  sections: DietPlanSection[];
}

export const planApi = {
  get: () => apiRequest<DietPlanResponse>("/me/diet-plan"),
  start: () =>
    apiRequest<DietPlanResponse["plan"]>("/me/start-plan", { body: {} }),
};

export interface PhotoRow {
  id: string;
  photo_url: string;
  meal_type: string;
  remarks: string | null;
  day_number: number | null;
  uploaded_at: string;
}

export const photosApi = {
  list: (day?: number) =>
    apiRequest<PhotoRow[]>(`/me/photos${day ? `?day=${day}` : ""}`),
  comments: (photoId: string) =>
    apiRequest<
      Array<{ id: string; comment: string; created_at: string; read_at: string | null }>
    >(`/me/photos/${photoId}/comments`),
};

export async function uploadPhoto(input: {
  uri: string;
  mealType: "breakfast" | "lunch" | "dinner" | "exercise" | "other";
  dayNumber?: number;
  remarks?: string;
  dietPlanId?: string;
}): Promise<PhotoRow> {
  const form = new FormData();

  if (Platform.OS === "web") {
    const blob = await (await fetch(input.uri)).blob();
    form.append("photo", blob, `photo-${Date.now()}.jpg`);
  } else {
    const filename = input.uri.split("/").pop() ?? `photo-${Date.now()}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const ext = match?.[1]?.toLowerCase() ?? "jpg";
    form.append("photo", {
      uri: input.uri,
      name: filename,
      type: ext === "png" ? "image/png" : "image/jpeg",
    } as unknown as Blob);
  }

  form.append("meal_type", input.mealType === "exercise" ? "other" : input.mealType);
  if (input.dayNumber != null) form.append("day_number", String(input.dayNumber));
  if (input.remarks) form.append("remarks", input.remarks);
  if (input.dietPlanId) form.append("diet_plan_id", input.dietPlanId);

  return apiRequest<PhotoRow>("/me/photos", {
    body: form,
    isFormData: true,
  });
}
