import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pedometer } from "expo-sensors";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const STEP_GOAL = 7000;
const STRIDE_METERS = 0.762;
const CALORIES_PER_STEP = 0.04;

function getTodayKey(userId: string) {
  const d = new Date();
  const dateStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  return `steps_${userId}_${dateStr}`;
}

export default function StepsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [available, setAvailable] = useState<boolean | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [todaySteps, setTodaySteps] = useState(0);
  const [sessionSteps, setSessionSteps] = useState(0);
  const [savedSessionTotal, setSavedSessionTotal] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  const subRef = useRef<{ remove: () => void } | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSteps = savedSessionTotal + sessionSteps;
  const displaySteps = Math.max(todaySteps, totalSteps);
  const goalPercent = Math.min(100, Math.round((displaySteps / STEP_GOAL) * 100));
  const distanceKm = ((displaySteps * STRIDE_METERS) / 1000).toFixed(2);
  const calories = Math.round(displaySteps * CALORIES_PER_STEP);
  const sessionDurationSec = sessionStartedAt
    ? Math.floor((now - sessionStartedAt) / 1000)
    : 0;

  const loadSavedSteps = useCallback(async () => {
    if (!user) return;
    try {
      const stored = await AsyncStorage.getItem(getTodayKey(user.id));
      if (stored) {
        const parsed = JSON.parse(stored);
        setSavedSessionTotal(parsed.totalSteps || 0);
      }
    } catch {}
  }, [user]);

  const fetchTodaySteps = useCallback(async () => {
    if (Platform.OS === "web") return;
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      const result = await Pedometer.getStepCountAsync(start, end);
      if (result?.steps != null) setTodaySteps(result.steps);
    } catch {}
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (Platform.OS === "web") {
        if (mounted) setAvailable(false);
        return;
      }
      try {
        const ok = await Pedometer.isAvailableAsync();
        if (!mounted) return;
        setAvailable(ok);
        if (ok) {
          if (Platform.OS === "android") {
            const perm = await Pedometer.requestPermissionsAsync();
            if (!perm.granted) {
              setPermissionDenied(true);
              return;
            }
          }
          await fetchTodaySteps();
          await loadSavedSteps();
        }
      } catch {
        if (mounted) setAvailable(false);
      }
    })();
    return () => {
      mounted = false;
      if (subRef.current) subRef.current.remove();
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [fetchTodaySteps, loadSavedSteps]);

  const persistSteps = useCallback(
    async (total: number) => {
      if (!user) return;
      try {
        await AsyncStorage.setItem(
          getTodayKey(user.id),
          JSON.stringify({ totalSteps: total, updatedAt: Date.now() }),
        );
      } catch {}
    },
    [user],
  );

  const startTracking = () => {
    if (!available || isTracking) return;
    try {
      const sub = Pedometer.watchStepCount((result) => {
        setSessionSteps(result.steps);
      });
      subRef.current = sub;
      setSessionStartedAt(Date.now());
      setSessionSteps(0);
      setIsTracking(true);
      tickRef.current = setInterval(() => setNow(Date.now()), 1000);
    } catch (e) {
      Alert.alert("Could not start", "Step tracking is not available right now.");
    }
  };

  const stopTracking = async () => {
    if (subRef.current) {
      subRef.current.remove();
      subRef.current = null;
    }
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    const newTotal = savedSessionTotal + sessionSteps;
    setSavedSessionTotal(newTotal);
    setSessionSteps(0);
    setSessionStartedAt(null);
    setIsTracking(false);
    await persistSteps(newTotal);
    await fetchTodaySteps();
  };

  const resetTodaySession = () => {
    Alert.alert(
      "Reset session count?",
      "This clears your manual session count for today. Phone-tracked steps stay.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            if (subRef.current) {
              subRef.current.remove();
              subRef.current = null;
            }
            if (tickRef.current) {
              clearInterval(tickRef.current);
              tickRef.current = null;
            }
            setSavedSessionTotal(0);
            setSessionSteps(0);
            setSessionStartedAt(null);
            setIsTracking(false);
            await persistSteps(0);
          },
        },
      ],
    );
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m ${sec}s`;
    return `${m}m ${sec}s`;
  };

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
    ringWrap: {
      alignItems: "center",
      marginTop: 8,
      marginBottom: 24,
    },
    ringCenter: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    bigSteps: {
      fontSize: 52,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    bigStepsLabel: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_500Medium",
      marginTop: 2,
    },
    goalText: {
      fontSize: 12,
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
      marginTop: 6,
    },
    statsRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
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
    statIcon: { marginBottom: 6 },
    statValue: {
      fontSize: 18,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    statLabel: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    sessionCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 20,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 3,
    },
    sessionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    sessionTitle: {
      fontSize: 15,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    liveDot: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#e53935",
    },
    liveText: {
      fontSize: 11,
      color: "#e53935",
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
    },
    sessionRow: {
      flexDirection: "row",
      gap: 14,
      marginBottom: 16,
    },
    sessionStat: {
      flex: 1,
      alignItems: "center",
    },
    sessionValue: {
      fontSize: 26,
      fontWeight: "700" as const,
      color: colors.primary,
      fontFamily: "Inter_700Bold",
    },
    sessionLabel: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    btnRow: {
      flexDirection: "row",
      gap: 10,
    },
    primaryBtn: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
    },
    stopBtn: {
      flex: 1,
      backgroundColor: "#e53935",
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
    },
    btnText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
    },
    resetBtn: {
      borderRadius: 12,
      paddingVertical: 13,
      paddingHorizontal: 16,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    resetBtnText: {
      color: colors.foreground,
      fontSize: 13,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
    },
    infoCard: {
      backgroundColor: "#e8f5e9",
      borderRadius: 14,
      padding: 14,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      marginTop: 8,
    },
    infoText: {
      flex: 1,
      fontSize: 12,
      color: "#2d7d46",
      fontFamily: "Inter_500Medium",
      lineHeight: 17,
    },
    unsupportedCard: {
      backgroundColor: "#fff3e0",
      borderRadius: 14,
      padding: 18,
      alignItems: "center",
      gap: 10,
    },
    unsupportedTitle: {
      fontSize: 16,
      fontWeight: "700" as const,
      color: "#e65100",
      fontFamily: "Inter_700Bold",
      textAlign: "center",
    },
    unsupportedText: {
      fontSize: 13,
      color: "#bf5700",
      textAlign: "center",
      fontFamily: "Inter_400Regular",
      lineHeight: 18,
    },
  });

  const ringSize = 220;
  const strokeWidth = 16;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (goalPercent / 100) * circumference;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Step Counter</Text>
          <Text style={styles.headerSub}>
            Daily goal: {STEP_GOAL.toLocaleString()} steps
          </Text>
        </View>

        <View style={styles.content}>
          {available === false ? (
            <View style={styles.unsupportedCard}>
              <Feather name="alert-circle" size={32} color="#e65100" />
              <Text style={styles.unsupportedTitle}>
                {Platform.OS === "web"
                  ? "Step counter works on phone only"
                  : "Step sensor not available"}
              </Text>
              <Text style={styles.unsupportedText}>
                {Platform.OS === "web"
                  ? "Open the app on your Android or iPhone using Expo Go to count your steps."
                  : "Your device does not have a step sensor, or it could not be accessed."}
              </Text>
            </View>
          ) : permissionDenied ? (
            <View style={styles.unsupportedCard}>
              <Feather name="lock" size={32} color="#e65100" />
              <Text style={styles.unsupportedTitle}>Permission needed</Text>
              <Text style={styles.unsupportedText}>
                Please allow Physical Activity / Motion access in your phone settings, then reopen this screen.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.ringWrap}>
                <Svg width={ringSize} height={ringSize}>
                  <Circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={radius}
                    stroke={colors.muted}
                    strokeWidth={strokeWidth}
                    fill="none"
                  />
                  <Circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={radius}
                    stroke={colors.primary}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                  />
                </Svg>
                <View style={styles.ringCenter}>
                  <Text style={styles.bigSteps}>{displaySteps.toLocaleString()}</Text>
                  <Text style={styles.bigStepsLabel}>steps today</Text>
                  <Text style={styles.goalText}>{goalPercent}% of daily goal</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Feather
                    name="map-pin"
                    size={20}
                    color={colors.primary}
                    style={styles.statIcon}
                  />
                  <Text style={styles.statValue}>{distanceKm}</Text>
                  <Text style={styles.statLabel}>km</Text>
                </View>
                <View style={styles.statCard}>
                  <Feather
                    name="zap"
                    size={20}
                    color="#f57c00"
                    style={styles.statIcon}
                  />
                  <Text style={styles.statValue}>{calories}</Text>
                  <Text style={styles.statLabel}>kcal</Text>
                </View>
                <View style={styles.statCard}>
                  <Feather
                    name="target"
                    size={20}
                    color="#1976d2"
                    style={styles.statIcon}
                  />
                  <Text style={styles.statValue}>
                    {Math.max(0, STEP_GOAL - displaySteps).toLocaleString()}
                  </Text>
                  <Text style={styles.statLabel}>to go</Text>
                </View>
              </View>

              <View style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionTitle}>Walking Session</Text>
                  {isTracking && (
                    <View style={styles.liveDot}>
                      <View style={styles.dot} />
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                  )}
                </View>

                <View style={styles.sessionRow}>
                  <View style={styles.sessionStat}>
                    <Text style={styles.sessionValue}>{sessionSteps}</Text>
                    <Text style={styles.sessionLabel}>session steps</Text>
                  </View>
                  <View style={styles.sessionStat}>
                    <Text style={styles.sessionValue}>
                      {formatTime(sessionDurationSec)}
                    </Text>
                    <Text style={styles.sessionLabel}>duration</Text>
                  </View>
                </View>

                <View style={styles.btnRow}>
                  {!isTracking ? (
                    <Pressable
                      style={({ pressed }) => [
                        styles.primaryBtn,
                        { opacity: pressed ? 0.85 : 1 },
                      ]}
                      onPress={startTracking}
                    >
                      <Feather name="play" size={18} color="#fff" />
                      <Text style={styles.btnText}>Start Walking</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={({ pressed }) => [
                        styles.stopBtn,
                        { opacity: pressed ? 0.85 : 1 },
                      ]}
                      onPress={stopTracking}
                    >
                      <Feather name="square" size={18} color="#fff" />
                      <Text style={styles.btnText}>Stop & Save</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={({ pressed }) => [
                      styles.resetBtn,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                    onPress={resetTodaySession}
                  >
                    <Feather name="refresh-ccw" size={14} color={colors.foreground} />
                    <Text style={styles.resetBtnText}>Reset</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Feather name="info" size={16} color="#2d7d46" />
                <Text style={styles.infoText}>
                  Steps are read from your phone's built-in motion sensor — no internet needed. Keep the phone in your pocket or hand while walking.
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
