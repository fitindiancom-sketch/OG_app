import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DayProgressRing } from "@/components/DayProgressRing";
import { useAuth } from "@/context/AuthContext";
import { usePlan } from "@/context/PlanContext";
import { useColors } from "@/hooks/useColors";

const MEAL_ICONS = { breakfast: "☀️", lunch: "🌤️", dinner: "🌙" };

const WEEKS: { label: string; days: number[] }[] = [
  { label: "Week 1", days: [1, 2, 3, 4, 5, 6, 7] },
  { label: "Week 2", days: [8, 9, 10, 11, 12, 13, 14] },
  { label: "Week 3", days: [15, 16, 17, 18, 19, 20, 21] },
  { label: "Week 4", days: [22, 23, 24, 25, 26, 27, 28] },
  { label: "Week 5", days: [29, 30] },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    plan,
    currentDay,
    isStarted,
    daysToExpire,
    startDiet,
    getCompletionPercent,
  } = usePlan();
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  const todayPlan = plan?.days.find((d) => d.dayNumber === currentDay);
  const todayPercent = isStarted ? getCompletionPercent(currentDay) : 0;
  const daysLeft = 30 - currentDay + 1;

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? "Good morning" : greetingHour < 17 ? "Good afternoon" : "Good evening";

  const getWeekPercent = (days: number[]) => {
    const total = days.reduce((sum, d) => sum + getCompletionPercent(d), 0);
    return Math.round(total / days.length);
  };

  const handleStartDiet = () => {
    Alert.alert(
      "Start your 30-day diet?",
      "Day 1 begins today. You will not be able to change the start date later.",
      [
        { text: "Not yet", style: "cancel" },
        {
          text: "Start Now",
          style: "default",
          onPress: async () => {
            await startDiet();
            setExpandedWeek(0);
          },
        },
      ],
    );
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
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
      marginBottom: isStarted ? 20 : 0,
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
    headerRight: { alignItems: "center" },
    planName: {
      fontSize: 11,
      color: "rgba(255,255,255,0.7)",
      fontFamily: "Inter_400Regular",
    },
    statsRow: { flexDirection: "row", gap: 12 },
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
    startCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 22,
      marginBottom: 18,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    startIconWrap: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: "#e8f5e9",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },
    startTitle: {
      fontSize: 18,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      textAlign: "center",
      marginBottom: 6,
    },
    startSub: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      lineHeight: 19,
      marginBottom: 18,
    },
    startBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 15,
      paddingHorizontal: 32,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      width: "100%",
    },
    startBtnText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
    },
    expiryCard: {
      backgroundColor: daysToExpire <= 3 ? "#ffebee" : "#fff8e1",
      borderRadius: 14,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: daysToExpire <= 3 ? "#ffcdd2" : "#ffe082",
    },
    expiryText: {
      flex: 1,
      fontSize: 13,
      color: daysToExpire <= 3 ? "#c62828" : "#e65100",
      fontFamily: "Inter_600SemiBold",
      lineHeight: 18,
    },
    notesCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },
    noteRow: {
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-start",
    },
    noteFlag: {
      fontSize: 16,
      lineHeight: 20,
      width: 22,
    },
    noteText: {
      flex: 1,
      fontSize: 12.5,
      color: colors.foreground,
      fontFamily: "Inter_500Medium",
      lineHeight: 18,
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
    mealRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
    mealPreview: {
      flex: 1,
      backgroundColor: colors.muted,
      borderRadius: 12,
      padding: 12,
      alignItems: "center",
    },
    mealIcon: { fontSize: 20, marginBottom: 4 },
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
    weekCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      marginBottom: 10,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    weekHeader: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      gap: 14,
    },
    weekInfo: { flex: 1 },
    weekTitle: {
      fontSize: 15,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    weekSub: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    weekDayGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      paddingHorizontal: 14,
      paddingBottom: 14,
      paddingTop: 4,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    dayPill: {
      alignItems: "center",
      gap: 4,
    },
    currentBadge: {
      position: "absolute",
      top: -4,
      right: -4,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: "#f57c00",
      borderWidth: 2,
      borderColor: colors.card,
      zIndex: 1,
    },
    dayPillLabel: {
      fontSize: 10,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
  });

  if (!user || !plan) return null;

  const renderNotStartedState = () => (
    <>
      <View style={styles.startCard}>
        <View style={styles.startIconWrap}>
          <Feather name="play-circle" size={36} color={colors.primary} />
        </View>
        <Text style={styles.startTitle}>Ready to begin your journey?</Text>
        <Text style={styles.startSub}>
          Tap below to start your 30-day plan. Day 1 will begin today and your photo upload windows will open automatically.
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.startBtn,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleStartDiet}
        >
          <Feather name="play" size={18} color="#fff" />
          <Text style={styles.startBtnText}>Start Diet</Text>
        </Pressable>
      </View>

      <View style={styles.expiryCard}>
        <Feather
          name="clock"
          size={20}
          color={daysToExpire <= 3 ? "#c62828" : "#e65100"}
        />
        <Text style={styles.expiryText}>
          {daysToExpire > 0
            ? `Your plan will expire in ${daysToExpire} day${daysToExpire !== 1 ? "s" : ""} if not started.`
            : "Your plan has expired. Please contact your dietitian."}
        </Text>
      </View>

      <View style={styles.notesCard}>
        <View style={styles.noteRow}>
          <Text style={styles.noteFlag}>🇬🇧</Text>
          <Text style={styles.noteText}>
            If you do not start your diet plan, it will expire in 10 days automatically.
          </Text>
        </View>
        <View style={styles.noteRow}>
          <Text style={styles.noteFlag}>🇮🇳</Text>
          <Text style={styles.noteText}>
            अगर आप अपना डाइट प्लान शुरू नहीं करते, तो यह 10 दिनों में अपने आप समाप्त हो जाएगा।
          </Text>
        </View>
        <View style={styles.noteRow}>
          <Text style={styles.noteFlag}>🇮🇳</Text>
          <Text style={styles.noteText}>
            जर तुम्ही तुमचा डाएट प्लॅन सुरू केला नाही, तर तो 10 दिवसांत आपोआप संपेल.
          </Text>
        </View>
      </View>
    </>
  );

  const renderStartedState = () => (
    <>
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
                  <Text style={styles.mealType}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.viewTodayBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => router.push(`/day/${currentDay}`)}
            >
              <Text style={styles.viewTodayBtnText}>View Today's Plan</Text>
              <Feather name="chevron-right" size={18} color="#fff" />
            </Pressable>
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Weekly Progress</Text>
      {WEEKS.map((week, idx) => {
        const pct = getWeekPercent(week.days);
        const isExpanded = expandedWeek === idx;
        const containsToday = week.days.includes(currentDay);
        return (
          <View key={week.label} style={styles.weekCard}>
            <Pressable
              style={({ pressed }) => [
                styles.weekHeader,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => setExpandedWeek(isExpanded ? null : idx)}
            >
              <DayProgressRing
                percent={pct}
                size={48}
                strokeWidth={4}
                dayNumber={idx + 1}
              />
              <View style={styles.weekInfo}>
                <Text style={styles.weekTitle}>
                  {week.label}
                  {containsToday ? "  •  Current" : ""}
                </Text>
                <Text style={styles.weekSub}>
                  Day {week.days[0]}–{week.days[week.days.length - 1]} · {pct}% done
                </Text>
              </View>
              <Feather
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.mutedForeground}
              />
            </Pressable>
            {isExpanded && (
              <View style={styles.weekDayGrid}>
                {week.days.map((dayNum) => {
                  const dPct = getCompletionPercent(dayNum);
                  const isToday = dayNum === currentDay;
                  return (
                    <Pressable
                      key={dayNum}
                      style={({ pressed }) => [
                        styles.dayPill,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                      onPress={() => router.push(`/day/${dayNum}`)}
                    >
                      <View>
                        {isToday && <View style={styles.currentBadge} />}
                        <DayProgressRing
                          percent={dPct}
                          size={48}
                          strokeWidth={3}
                          dayNumber={dayNum}
                        />
                      </View>
                      <Text style={styles.dayPillLabel}>{dPct}%</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greetingText}>{greeting},</Text>
              <Text style={styles.userName}>{user.name.split(" ")[0]}</Text>
            </View>
            {isStarted && (
              <View style={styles.headerRight}>
                <DayProgressRing percent={todayPercent} size={48} strokeWidth={4} />
                <Text style={styles.planName}>Today</Text>
              </View>
            )}
          </View>

          {isStarted && (
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
          )}
        </View>

        <View style={styles.content}>
          {isStarted ? renderStartedState() : renderNotStartedState()}
        </View>
      </ScrollView>
    </View>
  );
}
