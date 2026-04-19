import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

export interface Meal {
  type: "breakfast" | "lunch" | "dinner";
  description: string;
}

export interface Exercise {
  description: string;
}

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

const DEMO_PLAN: DietPlan = {
  id: "plan001",
  name: "30-Day Healthy Living Plan",
  days: Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    const mealSets = [
      {
        breakfast: "4 soaked almonds + 1 seasonal fruit + 1 glass warm water",
        lunch: "2 rotis + dal + mixed vegetable sabzi + salad",
        dinner: "Brown rice + dal + steamed vegetables + buttermilk",
        exercises: ["30 min brisk walk", "10 min stretching"],
      },
      {
        breakfast: "Oats porridge with banana + green tea",
        lunch: "Grilled chicken/paneer + quinoa + cucumber salad",
        dinner: "Vegetable soup + 1 roti + curd",
        exercises: ["20 min yoga", "15 min light cardio", "5 min meditation"],
      },
      {
        breakfast: "2 boiled eggs + whole wheat toast + orange juice",
        lunch: "Brown rice + rajma / kidney beans + salad",
        dinner: "Grilled fish/tofu + stir-fried veggies + green tea",
        exercises: ["30 min cycling", "10 min core exercises"],
      },
      {
        breakfast: "Smoothie (banana + spinach + almond milk) + 5 walnuts",
        lunch: "Chickpea salad + 1 roti + fresh lime water",
        dinner: "Khichdi + steamed broccoli + curd",
        exercises: ["25 min jogging", "10 min stretching", "5 min breathing"],
      },
      {
        breakfast: "Upma with vegetables + herbal tea",
        lunch: "Grilled paneer wrap + tomato soup",
        dinner: "Lentil soup + 2 rotis + mixed vegetable salad",
        exercises: ["40 min walk", "15 min yoga"],
      },
    ];
    const set = mealSets[(day - 1) % mealSets.length];
    return {
      dayNumber: day,
      meals: {
        breakfast: set.breakfast,
        lunch: set.lunch,
        dinner: set.dinner,
      },
      exercises: set.exercises,
    };
  }),
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

  const makeKey = (
    dayNumber: number,
    mealType: string,
    exerciseIndex?: number
  ) => `${dayNumber}_${mealType}_${exerciseIndex ?? ""}`;

  const markComplete = useCallback(
    async (
      dayNumber: number,
      mealType: "breakfast" | "lunch" | "dinner" | "exercise",
      exerciseIndex?: number,
      completed = true
    ) => {
      if (!user) return;
      const key = makeKey(dayNumber, mealType, exerciseIndex);
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
        const entry: ProgressEntry = {
          userId: user.id,
          dayNumber,
          mealType,
          exerciseIndex,
          completed,
          timestamp: new Date().toISOString(),
        };
        updated = [...progress, entry];
      }
      await saveProgress(updated);
      void key;
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
        const entry: ProgressEntry = {
          userId: user.id,
          dayNumber,
          mealType,
          exerciseIndex,
          completed: false,
          photoUri,
          timestamp: new Date().toISOString(),
        };
        updated = [...progress, entry];
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
      const entry = progress.find(
        (p) =>
          p.userId === user.id &&
          p.dayNumber === dayNumber &&
          p.mealType === mealType &&
          p.exerciseIndex === exerciseIndex
      );
      return entry?.completed ?? false;
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
      const entry = progress.find(
        (p) =>
          p.userId === user.id &&
          p.dayNumber === dayNumber &&
          p.mealType === mealType &&
          p.exerciseIndex === exerciseIndex
      );
      return entry?.photoUri;
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
