import { Feather } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import * as Sharing from "expo-sharing";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlan } from "@/context/PlanContext";
import { useColors } from "@/hooks/useColors";

const PDF_ASSET = require("../../assets/diet-plan.pdf");

const MEAL_LABELS: Record<"breakfast" | "lunch" | "dinner", string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

const MEAL_ICONS: Record<"breakfast" | "lunch" | "dinner", string> = {
  breakfast: "sun",
  lunch: "cloud",
  dinner: "moon",
};

const MEAL_TIMES: Record<"breakfast" | "lunch" | "dinner", string> = {
  breakfast: "7:00 – 11:00 AM",
  lunch: "11:00 AM – 2:00 PM",
  dinner: "6:00 – 9:00 PM",
};

function PdfWebViewer({ uri }: { uri: string }) {
  if (Platform.OS !== "web") return null;
  return React.createElement(
    "iframe",
    {
      src: uri,
      style: {
        width: "100%",
        height: 600,
        border: "none",
        borderRadius: 12,
      },
      title: "Diet Plan PDF",
    },
    null,
  );
}

export default function MyPlanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { plan, currentDay } = usePlan();

  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(currentDay);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const asset = Asset.fromModule(PDF_ASSET);
        await asset.downloadAsync();
        if (!mounted) return;
        setPdfUri(asset.localUri || asset.uri);
      } catch {
      } finally {
        if (mounted) setPdfLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const openPdf = async () => {
    if (!pdfUri) return;
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") {
          window.open(pdfUri, "_blank");
        }
        return;
      }
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: "application/pdf",
          dialogTitle: "Open Diet Plan PDF",
          UTI: "com.adobe.pdf",
        });
      } else {
        await Linking.openURL(pdfUri);
      }
    } catch {
      Alert.alert(
        "Cannot open PDF",
        "Please install a PDF viewer app and try again.",
      );
    }
  };

  const totalDays = plan?.days.length ?? 0;

  const planSummary = useMemo(() => {
    if (!plan) return null;
    const sample = plan.days[0];
    return {
      mealsPerDay: 3,
      exercisesPerDay: sample?.exercises.length ?? 0,
      totalMeals: totalDays * 3,
      totalExercises: totalDays * (sample?.exercises.length ?? 0),
    };
  }, [plan, totalDays]);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    header: {
      paddingHorizontal: 20,
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20),
      paddingBottom: 24,
      backgroundColor: colors.primary,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "700" as const,
      color: "#fff",
      fontFamily: "Inter_700Bold",
    },
    headerSub: {
      fontSize: 13,
      color: "rgba(255,255,255,0.85)",
      fontFamily: "Inter_400Regular",
      marginTop: 4,
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
      marginBottom: 12,
      marginTop: 8,
    },
    sectionHint: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginBottom: 12,
      marginTop: -6,
      lineHeight: 17,
    },
    pdfCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 18,
      marginBottom: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 3,
    },
    pdfRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    pdfIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 12,
      backgroundColor: "#fdecea",
      alignItems: "center",
      justifyContent: "center",
    },
    pdfTitle: {
      fontSize: 15,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    pdfMeta: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    openBtn: {
      marginTop: 14,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 13,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    openBtnText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
    },
    iframeWrap: {
      marginTop: 14,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: "#f5f5f5",
    },
    summaryRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 24,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: "700" as const,
      color: colors.primary,
      fontFamily: "Inter_700Bold",
    },
    summaryLabel: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
      textAlign: "center",
    },
    dayCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      marginBottom: 10,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    dayHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 14,
    },
    dayHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    dayBadge: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    todayBadge: {
      backgroundColor: "#f57c00",
    },
    dayBadgeText: {
      color: "#fff",
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      fontSize: 13,
    },
    dayTitle: {
      fontSize: 14,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    daySub: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    dayBody: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      padding: 14,
      gap: 16,
    },
    mealBlock: {
      gap: 8,
    },
    mealHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    mealLabel: {
      fontSize: 13,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    mealTime: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    mealText: {
      fontSize: 13,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
      lineHeight: 19,
    },
    exerciseBlock: {
      gap: 6,
    },
    exerciseItem: {
      flexDirection: "row",
      gap: 8,
      alignItems: "flex-start",
    },
    exerciseDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#f57c00",
      marginTop: 7,
    },
    exerciseText: {
      flex: 1,
      fontSize: 13,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
      lineHeight: 19,
    },
    todayPill: {
      backgroundColor: "#fff3e0",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    todayPillText: {
      fontSize: 10,
      fontWeight: "700" as const,
      color: "#e65100",
      fontFamily: "Inter_700Bold",
    },
    syncCard: {
      backgroundColor: "#e3f2fd",
      borderRadius: 12,
      padding: 12,
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-start",
      marginBottom: 20,
    },
    syncText: {
      flex: 1,
      fontSize: 12,
      color: "#1565c0",
      fontFamily: "Inter_500Medium",
      lineHeight: 17,
    },
    loadingText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginTop: 10,
      textAlign: "center",
    },
  });

  if (!plan) return null;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Diet Plan</Text>
          <Text style={styles.headerSub}>{plan.name}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.syncCard}>
            <Feather name="cloud" size={16} color="#1565c0" />
            <Text style={styles.syncText}>
              Your dietitian assigns this plan from the web dashboard. Any updates made there will appear here automatically.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Original PDF</Text>
          <View style={styles.pdfCard}>
            <View style={styles.pdfRow}>
              <View style={styles.pdfIconWrap}>
                <Feather name="file-text" size={26} color="#e53935" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pdfTitle}>Diet Plan — Mital Sali</Text>
                <Text style={styles.pdfMeta}>WHW Level-1 · PDF · 2.7 MB</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.openBtn,
                { opacity: pressed || pdfLoading ? 0.7 : 1 },
              ]}
              onPress={openPdf}
              disabled={pdfLoading || !pdfUri}
            >
              <Feather name="external-link" size={16} color="#fff" />
              <Text style={styles.openBtnText}>
                {pdfLoading ? "Loading..." : Platform.OS === "web" ? "Open PDF in New Tab" : "Open PDF"}
              </Text>
            </Pressable>

            {Platform.OS === "web" && pdfUri && (
              <View style={styles.iframeWrap}>
                <PdfWebViewer uri={pdfUri} />
              </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>Plan Summary</Text>
          {planSummary && (
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{totalDays}</Text>
                <Text style={styles.summaryLabel}>Total Days</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{planSummary.totalMeals}</Text>
                <Text style={styles.summaryLabel}>Meals</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>
                  {planSummary.totalExercises}
                </Text>
                <Text style={styles.summaryLabel}>Activities</Text>
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>Day-by-Day Plan</Text>
          <Text style={styles.sectionHint}>
            Tap any day to expand and view meals + activities.
          </Text>

          {plan.days.map((day) => {
            const isExpanded = expandedDay === day.dayNumber;
            const isToday = day.dayNumber === currentDay;
            return (
              <View key={day.dayNumber} style={styles.dayCard}>
                <Pressable
                  style={({ pressed }) => [
                    styles.dayHeader,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() =>
                    setExpandedDay(isExpanded ? null : day.dayNumber)
                  }
                >
                  <View style={styles.dayHeaderLeft}>
                    <View
                      style={[styles.dayBadge, isToday && styles.todayBadge]}
                    >
                      <Text style={styles.dayBadgeText}>{day.dayNumber}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dayTitle}>Day {day.dayNumber}</Text>
                      <Text style={styles.daySub}>
                        3 meals · {day.exercises.length} activities
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {isToday && (
                      <View style={styles.todayPill}>
                        <Text style={styles.todayPillText}>TODAY</Text>
                      </View>
                    )}
                    <Feather
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={colors.mutedForeground}
                    />
                  </View>
                </Pressable>

                {isExpanded && (
                  <View style={styles.dayBody}>
                    {(["breakfast", "lunch", "dinner"] as const).map((m) => (
                      <View key={m} style={styles.mealBlock}>
                        <View style={styles.mealHeader}>
                          <Feather
                            name={MEAL_ICONS[m] as any}
                            size={16}
                            color={colors.primary}
                          />
                          <Text style={styles.mealLabel}>{MEAL_LABELS[m]}</Text>
                          <Text style={styles.mealTime}>· {MEAL_TIMES[m]}</Text>
                        </View>
                        <Text style={styles.mealText}>{day.meals[m]}</Text>
                      </View>
                    ))}

                    <View style={styles.exerciseBlock}>
                      <View style={styles.mealHeader}>
                        <Feather
                          name="activity"
                          size={16}
                          color="#f57c00"
                        />
                        <Text style={styles.mealLabel}>Activities</Text>
                      </View>
                      {day.exercises.map((ex, idx) => (
                        <View key={idx} style={styles.exerciseItem}>
                          <View style={styles.exerciseDot} />
                          <Text style={styles.exerciseText}>{ex}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
