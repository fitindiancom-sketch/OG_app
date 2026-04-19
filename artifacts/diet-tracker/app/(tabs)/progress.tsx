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
import { usePlan } from "@/context/PlanContext";
import { DayProgressRing } from "@/components/DayProgressRing";

export default function ProgressScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { plan, currentDay, getCompletionPercent } = usePlan();

  const totalCompleted = plan
    ? plan.days
        .slice(0, currentDay)
        .reduce((sum, d) => sum + (getCompletionPercent(d.dayNumber) === 100 ? 1 : 0), 0)
    : 0;

  const overallPercent = Math.round(
    plan
      ? plan.days.slice(0, currentDay).reduce((sum, d) => sum + getCompletionPercent(d.dayNumber), 0) / currentDay
      : 0
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
      paddingBottom: 20,
      backgroundColor: colors.primary,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "700" as const,
      color: "#fff",
      fontFamily: "Inter_700Bold",
      marginBottom: 16,
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
      fontSize: 22,
      fontWeight: "700" as const,
      color: "#fff",
      fontFamily: "Inter_700Bold",
    },
    statLabel: {
      fontSize: 10,
      color: "rgba(255,255,255,0.8)",
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      marginTop: 2,
    },
    scroll: {
      flex: 1,
    },
    content: {
      padding: 20,
      paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80),
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      marginBottom: 16,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    dayItem: {
      width: "18.5%",
      alignItems: "center",
      gap: 4,
    },
    dayLabel: {
      fontSize: 9,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    legendRow: {
      flexDirection: "row",
      gap: 16,
      marginBottom: 20,
      flexWrap: "wrap",
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legendText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
  });

  if (!plan) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Progress</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{currentDay}</Text>
            <Text style={styles.statLabel}>Current Day</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalCompleted}</Text>
            <Text style={styles.statLabel}>Full Days Done</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{overallPercent}%</Text>
            <Text style={styles.statLabel}>Avg Completion</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>All 30 Days</Text>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendText}>100% complete</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
              <Text style={styles.legendText}>In progress</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.muted }]} />
              <Text style={styles.legendText}>Not started</Text>
            </View>
          </View>

          <View style={styles.grid}>
            {plan.days.map((day) => {
              const pct = getCompletionPercent(day.dayNumber);
              const isFuture = day.dayNumber > currentDay;
              return (
                <Pressable
                  key={day.dayNumber}
                  style={({ pressed }) => [styles.dayItem, { opacity: isFuture ? 0.4 : pressed ? 0.7 : 1 }]}
                  onPress={() => !isFuture && router.push(`/day/${day.dayNumber}`)}
                  disabled={isFuture}
                >
                  <DayProgressRing
                    percent={isFuture ? 0 : pct}
                    size={52}
                    strokeWidth={3}
                    dayNumber={day.dayNumber}
                  />
                  <Text style={styles.dayLabel}>
                    {isFuture ? "–" : `${pct}%`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
