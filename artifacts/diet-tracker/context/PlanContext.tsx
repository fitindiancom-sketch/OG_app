import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

export interface DayPlan {
  dayNumber: number;
  meals: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  exercises: string[];
}

export interface DietPlan {
  id: string;
  name: string;
  days: DayPlan[];
}

export interface ProgressEntry {
  userId: string;
  dayNumber: number;
  mealType: "breakfast" | "lunch" | "dinner" | "exercise";
  exerciseIndex?: number;
  completed: boolean;
  photoUri?: string;
  timestamp: string;
}

interface PlanContextValue {
  plan: DietPlan | null;
  progress: ProgressEntry[];
  currentDay: number;
  markComplete: (
    dayNumber: number,
    mealType: "breakfast" | "lunch" | "dinner" | "exercise",
    exerciseIndex?: number,
    completed?: boolean
  ) => Promise<void>;
  savePhoto: (
    dayNumber: number,
    mealType: "breakfast" | "lunch" | "dinner" | "exercise",
    exerciseIndex: number | undefined,
    photoUri: string
  ) => Promise<void>;
  getDayProgress: (dayNumber: number) => ProgressEntry[];
  getCompletionPercent: (dayNumber: number) => number;
  isItemComplete: (
    dayNumber: number,
    mealType: "breakfast" | "lunch" | "dinner" | "exercise",
    exerciseIndex?: number
  ) => boolean;
  getPhotoUri: (
    dayNumber: number,
    mealType: "breakfast" | "lunch" | "dinner" | "exercise",
    exerciseIndex?: number
  ) => string | undefined;
}

const PlanContext = createContext<PlanContextValue>({
  plan: null,
  progress: [],
  currentDay: 1,
  markComplete: async () => {},
  savePhoto: async () => {},
  getDayProgress: () => [],
  getCompletionPercent: () => 0,
  isItemComplete: () => false,
  getPhotoUri: () => undefined,
});

// WHW Diet Level-1 plan translated from the PDF (same daily plan repeated for 30 days)
const BREAKFAST_DESC =
  "• 8 soaked almonds\n" +
  "• Amla juice (Dabur/Baidyanath/Patanjali) 5–7 tsp + 1 glass water\n" +
  "• Aloe vera juice (Dabur/Baidyanath/Patanjali) 5–7 tsp + 1 glass water\n" +
  "• Carrot juice 200g + Beetroot 70g\n" +
  "• Any one: Apple 1 / Orange 3 / Guava 200g / Pomegranate 200g";

const LUNCH_DESC =
  "• Salad (any one): Carrot 250g OR Cucumber 250g OR Beetroot 70g\n" +
  "• Grain (any one): Wheat flour 60g OR Rava 60g OR Oats 60g\n" +
  "• Vegetables: 120g\n" +
  "• Protein (any one): Paneer 120g / Chickpeas 65g / Moong 65g / Rajma 65g / Egg whites 4 / Fish 175g / Chicken 190g\n" +
  "• Oil (any one): Ghee / Rice bran oil / Olive oil — 8g\n" +
  "• After lunch: 100g curd + water + salt + cumin powder\n" +
  "• 2 tsp roasted flaxseeds";

const DINNER_DESC =
  "• Salad (any one): Carrot 150g OR Cucumber 200g OR Beetroot 50g\n" +
  "• Wheat flour 40g (optional, only if needed)\n" +
  "• Vegetables: 120g\n" +
  "• Protein (any one): Paneer 120g / Chickpeas 65g / Rajma 65g / Soya wadi 25g / Egg whites 4 / Fish 175g / Chicken 190g\n" +
  "• Oil (any one): Ghee / Rice bran oil / Olive oil — 8g\n" +
  "• Drink 1 glass warm water before sleeping";

const EXERCISES = [
  "Morning: 1.5 glass warm water after waking up, then go for a walk",
  "Morning walk: 6000–7000 steps — track on Google Fit",
  "Evening snack (3–6 PM): 8 almonds + green or black tea (no milk/sugar/jaggery)",
  "Evening walk: 6000–7000 steps — share screenshot on WhatsApp",
];

const DEMO_PLAN: DietPlan = {
  id: "plan001",
  name: "WHW Diet Level-1 — Mital Sali",
  days: Array.from({ length: 30 }, (_, i) => ({
    dayNumber: i + 1,
    meals: {
      breakfast: BREAKFAST_DESC,
      lunch: LUNCH_DESC,
      dinner: DINNER_DESC,
    },
    exercises: EXERCISES,
  })),
};

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [plan] = useState<DietPlan>(DEMO_PLAN);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [currentDay, setCurrentDay] = useState(1);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(`progress_${user.id}`);
        if (stored) {
          setProgress(JSON.parse(stored));
        }
      } catch {
        // ignore
      }

      if (user.planStartDate) {
        const startDate = new Date(user.planStartDate);
        const now = new Date();
        const diffMs = now.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
        const day = Math.max(1, Math.min(30, diffDays));
        setCurrentDay(day);
      }
    })();
  }, [user]);

  const saveProgress = useCallback(
    async (newProgress: ProgressEntry[]) => {
      if (!user) return;
      await AsyncStorage.setItem(
        `progress_${user.id}`,
        JSON.stringify(newProgress)
      );
      setProgress(newProgress);
    },
    [user]
  );

  const markComplete = useCallback(
    async (
      dayNumber: number,
      mealType: "breakfast" | "lunch" | "dinner" | "exercise",
      exerciseIndex?: number,
      completed = true
    ) => {
      if (!user) return;
      const existing = progress.find(
        (p) =>
          p.userId === user.id &&
          p.dayNumber === dayNumber &&
          p.mealType === mealType &&
          p.exerciseIndex === exerciseIndex
      );
      let updated: ProgressEntry[];
      if (existing) {
        updated = progress.map((p) =>
          p.userId === user.id &&
          p.dayNumber === dayNumber &&
          p.mealType === mealType &&
          p.exerciseIndex === exerciseIndex
            ? { ...p, completed, timestamp: new Date().toISOString() }
            : p
        );
      } else {
        updated = [
          ...progress,
          {
            userId: user.id,
            dayNumber,
            mealType,
            exerciseIndex,
            completed,
            timestamp: new Date().toISOString(),
          },
        ];
      }
      await saveProgress(updated);
    },
    [user, progress, saveProgress]
  );

  const savePhoto = useCallback(
    async (
      dayNumber: number,
      mealType: "breakfast" | "lunch" | "dinner" | "exercise",
      exerciseIndex: number | undefined,
      photoUri: string
    ) => {
      if (!user) return;
      const existing = progress.find(
        (p) =>
          p.userId === user.id &&
          p.dayNumber === dayNumber &&
          p.mealType === mealType &&
          p.exerciseIndex === exerciseIndex
      );
      let updated: ProgressEntry[];
      if (existing) {
        updated = progress.map((p) =>
          p.userId === user.id &&
          p.dayNumber === dayNumber &&
          p.mealType === mealType &&
          p.exerciseIndex === exerciseIndex
            ? { ...p, photoUri, timestamp: new Date().toISOString() }
            : p
        );
      } else {
        updated = [
          ...progress,
          {
            userId: user.id,
            dayNumber,
            mealType,
            exerciseIndex,
            completed: false,
            photoUri,
            timestamp: new Date().toISOString(),
          },
        ];
      }
      await saveProgress(updated);
    },
    [user, progress, saveProgress]
  );

  const getDayProgress = useCallback(
    (dayNumber: number) => {
      if (!user) return [];
      return progress.filter(
        (p) => p.userId === user.id && p.dayNumber === dayNumber
      );
    },
    [user, progress]
  );

  const getCompletionPercent = useCallback(
    (dayNumber: number) => {
      const dayPlan = plan.days.find((d) => d.dayNumber === dayNumber);
      if (!dayPlan || !user) return 0;
      const total = 3 + dayPlan.exercises.length;
      const dayProgress = getDayProgress(dayNumber);
      const completed = dayProgress.filter((p) => p.completed).length;
      return Math.round((completed / total) * 100);
    },
    [plan, user, getDayProgress]
  );

  const isItemComplete = useCallback(
    (
      dayNumber: number,
      mealType: "breakfast" | "lunch" | "dinner" | "exercise",
      exerciseIndex?: number
    ) => {
      if (!user) return false;
      return (
        progress.find(
          (p) =>
            p.userId === user.id &&
            p.dayNumber === dayNumber &&
            p.mealType === mealType &&
            p.exerciseIndex === exerciseIndex
        )?.completed ?? false
      );
    },
    [user, progress]
  );

  const getPhotoUri = useCallback(
    (
      dayNumber: number,
      mealType: "breakfast" | "lunch" | "dinner" | "exercise",
      exerciseIndex?: number
    ) => {
      if (!user) return undefined;
      return progress.find(
        (p) =>
          p.userId === user.id &&
          p.dayNumber === dayNumber &&
          p.mealType === mealType &&
          p.exerciseIndex === exerciseIndex
      )?.photoUri;
    },
    [user, progress]
  );

  return (
    <PlanContext.Provider
      value={{
        plan,
        progress,
        currentDay,
        markComplete,
        savePhoto,
        getDayProgress,
        getCompletionPercent,
        isItemComplete,
        getPhotoUri,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  return useContext(PlanContext);
}
