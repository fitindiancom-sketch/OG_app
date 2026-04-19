import { router } from "expo-router";
import React from "react";
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
import { useAuth } from "@/context/AuthContext";
import { usePlan } from "@/context/PlanContext";
import { DayProgressRing } from "@/components/DayProgressRing";
import { Feather } from "@expo/vector-icons";

const MEAL_ICONS = { breakfast: "☀️", lunch: "🌤️", dinner: "🌙" };

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { plan, currentDay, getCompletionPercent } = usePlan();

  const todayPlan = plan?.days.find((d) => d.dayNumber === currentDay);
  const todayPercent = getCompletionPercent(currentDay);
  const daysLeft = 30 - currentDay + 1;

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? "Good morning" : greetingHour < 17 ? "Good afternoon" : "Good evening";

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20),
      paddingBottom: 20,
      backgroundColor: colors.primary,
    },
    greetingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    greetingText: {
      fontSize: 14,
      color: "rgba(255,255,255,0.8)",
      fontFamily: "Inter_400Regular",
    },
    userName: {
      fontSize: 22,
      fontWeight: "700" as const,
      color: "#fff",
      fontFamily: "Inter_700Bold",
    },
    headerRight: {
      alignItems: "center",
    },
    planName: {
      fontSize: 11,
      color: "rgba(255,255,255,0.7)",
      fontFamily: "Inter_400Regular",
    },
    statsRow: {
      flexDirection: "row",
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: "rgba(255,255,255,0.15)",
      borderRadius: 14,
      padding: 14,
      alignItems: "center",
    },
    statValue: {
      fontSize: 24,
      fontWeight: "700" as const,
      color: "#fff",
      fontFamily: "Inter_700Bold",
    },
    statLabel: {
      fontSize: 11,
      color: "rgba(255,255,255,0.8)",
      fontFamily: "Inter_400Regular",
      marginTop: 2,
      textAlign: "center",
    },
    content: {
      padding: 20,
      paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80),
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      marginBottom: 14,
    },
    todayCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 20,
      marginBottom: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 3,
    },
    todayCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    dayBadge: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    dayBadgeText: {
      fontSize: 12,
      fontWeight: "700" as const,
      color: "#fff",
      fontFamily: "Inter_700Bold",
    },
    progressLabel: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_500Medium",
    },
    mealRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 16,
    },
    mealPreview: {
      flex: 1,
      backgroundColor: colors.muted,
      borderRadius: 12,
      padding: 12,
      alignItems: "center",
    },
    mealIcon: {
      fontSize: 20,
      marginBottom: 4,
    },
    mealType: {
      fontSize: 11,
      fontWeight: "600" as const,
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
    },
    viewTodayBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
    },
    viewTodayBtnText: {
      fontSize: 15,
      fontWeight: "700" as const,
      color: "#fff",
      fontFamily: "Inter_700Bold",
    },
    warningCard: {
      backgroundColor: "#fff3e0",
      borderRadius: 14,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 24,
    },
    warningText: {
      flex: 1,
      fontSize: 13,
      color: "#e65100",
      fontFamily: "Inter_500Medium",
      lineHeight: 18,
    },
    weekGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    weekDayItem: {
      alignItems: "center",
      gap: 4,
    },
    weekDayLabel: {
      fontSize: 10,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
  });

  if (!user || !plan) return null;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greetingText}>{greeting},</Text>
              <Text style={styles.userName}>{user.name.split(" ")[0]}</Text>
            </View>
            <View style={styles.headerRight}>
              <DayProgressRing percent={todayPercent} size={48} strokeWidth={4} />
              <Text style={styles.planName}>Today</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{currentDay}</Text>
              <Text style={styles.statLabel}>Current Day</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{daysLeft}</Text>
              <Text style={styles.statLabel}>Days Left</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{todayPercent}%</Text>
              <Text style={styles.statLabel}>Today Done</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {daysLeft <= 4 && (
            <View style={styles.warningCard}>
              <Feather name="alert-triangle" size={20} color="#e65100" />
              <Text style={styles.warningText}>
                Your plan ends in {daysLeft} day{daysLeft !== 1 ? "s" : ""}! Make the most of it.
              </Text>
            </View>
          )}

          {todayPlan && (
            <>
              <Text style={styles.sectionTitle}>Today — Day {currentDay}</Text>
              <View style={styles.todayCard}>
                <View style={styles.todayCardHeader}>
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayBadgeText}>Day {currentDay} of 30</Text>
                  </View>
                  <Text style={styles.progressLabel}>{todayPercent}% complete</Text>
                </View>

                <View style={styles.mealRow}>
                  {(["breakfast", "lunch", "dinner"] as const).map((m) => (
                    <View key={m} style={styles.mealPreview}>
                      <Text style={styles.mealIcon}>{MEAL_ICONS[m]}</Text>
                      <Text style={styles.mealType}>{m.charAt(0).toUpperCase() + m.slice(1)}</Text>
                    </View>
                  ))}
                </View>

                <Pressable
                  style={({ pressed }) => [styles.viewTodayBtn, { opacity: pressed ? 0.85 : 1 }]}
                  onPress={() => router.push(`/day/${currentDay}`)}
                >
                  <Text style={styles.viewTodayBtnText}>View Today's Plan</Text>
                  <Feather name="chevron-right" size={18} color="#fff" />
                </Pressable>
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.weekGrid}>
            {Array.from({ length: Math.min(7, currentDay) }, (_, i) => {
              const dayNum = currentDay - 6 + i;
              if (dayNum < 1) return null;
              const pct = getCompletionPercent(dayNum);
              return (
                <Pressable
                  key={dayNum}
                  style={({ pressed }) => [styles.weekDayItem, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => router.push(`/day/${dayNum}`)}
                >
                  <DayProgressRing percent={pct} size={48} strokeWidth={3} dayNumber={dayNum} />
                  <Text style={styles.weekDayLabel}>{pct}%</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
