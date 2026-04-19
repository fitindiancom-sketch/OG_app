import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { usePlan } from "@/context/PlanContext";
import { MealCard } from "@/components/MealCard";
import { ExerciseCard } from "@/components/ExerciseCard";
import { DayProgressRing } from "@/components/DayProgressRing";
import { Feather } from "@expo/vector-icons";

const MEAL_LABELS = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

const MEAL_ICONS = {
  breakfast: "☀️",
  lunch: "🌤️",
  dinner: "🌙",
};

const MEAL_TIMES = {
  breakfast: "7:00 AM – 11:00 AM",
  lunch: "11:00 AM – 2:00 PM",
  dinner: "6:00 PM – 9:00 PM",
};

type TabKey = "meals" | "exercises";

export default function DayDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { dayNumber: dayParam } = useLocalSearchParams<{ dayNumber: string }>();
  const { plan, getCompletionPercent } = usePlan();
  const [activeTab, setActiveTab] = useState<TabKey>("meals");

  const dayNumber = parseInt(dayParam ?? "1", 10);
  const dayPlan = plan?.days.find((d) => d.dayNumber === dayNumber);
  const completionPercent = getCompletionPercent(dayNumber);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
      paddingBottom: 20,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    headerTitle: {
      flex: 1,
    },
    dayTitle: {
      fontSize: 20,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    planName: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    progressSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    progressText: {
      flex: 1,
    },
    progressPercent: {
      fontSize: 24,
      fontWeight: "700" as const,
      color: completionPercent === 100 ? colors.primary : colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    progressLabel: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    progressBar: {
      height: 6,
      backgroundColor: colors.muted,
      borderRadius: 3,
      marginTop: 8,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: completionPercent === 100 ? colors.primary : colors.accent,
      borderRadius: 3,
      width: `${completionPercent}%`,
    },
    tabRow: {
      flexDirection: "row",
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 10,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
    },
    tabActive: {
      backgroundColor: colors.primary,
    },
    tabInactive: {
      backgroundColor: colors.muted,
    },
    tabText: {
      fontSize: 13,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
    },
    tabTextActive: { color: "#fff" },
    tabTextInactive: { color: colors.mutedForeground },
    scroll: {
      flex: 1,
    },
    content: {
      padding: 20,
      paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80),
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      marginBottom: 14,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    navRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
    },
    navBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: colors.secondary,
    },
    navBtnText: {
      fontSize: 13,
      fontWeight: "600" as const,
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
    },
  });

  if (!dayPlan) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>Day not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]} onPress={() => router.back()}>
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerTitle}>
            <Text style={styles.dayTitle}>Day {dayNumber}</Text>
            <Text style={styles.planName}>30-Day Healthy Living Plan</Text>
          </View>
          <DayProgressRing percent={completionPercent} size={52} strokeWidth={4} />
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressText}>
            <Text style={styles.progressPercent}>{completionPercent}%</Text>
            <Text style={styles.progressLabel}>Completed today</Text>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          style={({ pressed }) => [
            styles.tab,
            activeTab === "meals" ? styles.tabActive : styles.tabInactive,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() => setActiveTab("meals")}
        >
          <Feather name="coffee" size={14} color={activeTab === "meals" ? "#fff" : colors.mutedForeground} />
          <Text style={[styles.tabText, activeTab === "meals" ? styles.tabTextActive : styles.tabTextInactive]}>
            Meals
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.tab,
            activeTab === "exercises" ? styles.tabActive : styles.tabInactive,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() => setActiveTab("exercises")}
        >
          <Feather name="zap" size={14} color={activeTab === "exercises" ? "#fff" : colors.mutedForeground} />
          <Text style={[styles.tabText, activeTab === "exercises" ? styles.tabTextActive : styles.tabTextInactive]}>
            Exercises ({dayPlan.exercises.length})
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {activeTab === "meals" && (
            <>
              <Text style={styles.sectionTitle}>Meals for Day {dayNumber}</Text>
              {(["breakfast", "lunch", "dinner"] as const).map((mealType) => (
                <MealCard
                  key={mealType}
                  dayNumber={dayNumber}
                  mealType={mealType}
                  description={dayPlan.meals[mealType]}
                  label={MEAL_LABELS[mealType]}
                  icon={MEAL_ICONS[mealType]}
                  timeSlot={MEAL_TIMES[mealType]}
                />
              ))}
            </>
          )}

          {activeTab === "exercises" && (
            <>
              <Text style={styles.sectionTitle}>Exercises for Day {dayNumber}</Text>
              {dayPlan.exercises.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No exercises for this day</Text>
                </View>
              ) : (
                dayPlan.exercises.map((exercise, idx) => (
                  <ExerciseCard
                    key={idx}
                    dayNumber={dayNumber}
                    exerciseIndex={idx}
                    description={exercise}
                  />
                ))
              )}
            </>
          )}

          <View style={styles.navRow}>
            {dayNumber > 1 && (
              <Pressable
                style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => router.replace(`/day/${dayNumber - 1}`)}
              >
                <Feather name="chevron-left" size={16} color={colors.primary} />
                <Text style={styles.navBtnText}>Day {dayNumber - 1}</Text>
              </Pressable>
            )}
            {dayNumber < 30 && (
              <Pressable
                style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => router.replace(`/day/${dayNumber + 1}`)}
              >
                <Text style={styles.navBtnText}>Day {dayNumber + 1}</Text>
                <Feather name="chevron-right" size={16} color={colors.primary} />
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
