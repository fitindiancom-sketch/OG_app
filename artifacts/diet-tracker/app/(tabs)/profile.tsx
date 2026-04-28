import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
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
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { usePlan } from "@/context/PlanContext";
import { Feather } from "@expo/vector-icons";

interface MenuItemProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}

function MenuItem({ icon, label, value, onPress, destructive }: MenuItemProps) {
  const colors = useColors();
  const styles = StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 12,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: destructive ? "#ffebee" : colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      flex: 1,
      fontSize: 15,
      color: destructive ? colors.destructive : colors.foreground,
      fontFamily: "Inter_500Medium",
    },
    value: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginRight: 4,
    },
  });
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={styles.iconBox}>
        <Feather name={icon as never} size={16} color={destructive ? colors.destructive : colors.primary} />
      </View>
      <Text style={styles.label}>{label}</Text>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {onPress && !destructive && <Feather name="chevron-right" size={16} color={colors.mutedForeground} />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { plan, currentDay, getCompletionPercent, dietStartDate } = usePlan();

  const startDate = dietStartDate
    ? new Date(dietStartDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "Not set";

  const endDate = dietStartDate
    ? new Date(new Date(dietStartDate).getTime() + 29 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Not set";

  const completedDays = plan
    ? plan.days.slice(0, currentDay).filter((d) => getCompletionPercent(d.dayNumber) === 100).length
    : 0;

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

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
      paddingBottom: 24,
      backgroundColor: colors.primary,
      alignItems: "center",
    },
    avatarCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    userName: {
      fontSize: 20,
      fontWeight: "700" as const,
      color: "#fff",
      fontFamily: "Inter_700Bold",
      marginBottom: 4,
    },
    userId: {
      fontSize: 13,
      color: "rgba(255,255,255,0.7)",
      fontFamily: "Inter_400Regular",
    },
    content: {
      padding: 20,
      paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80),
    },
    section: {
      backgroundColor: colors.card,
      borderRadius: 16,
      marginBottom: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700" as const,
      color: colors.mutedForeground,
      fontFamily: "Inter_700Bold",
      marginBottom: 8,
      marginTop: 20,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 16,
    },
    statsRow: {
      flexDirection: "row",
      paddingVertical: 16,
      paddingHorizontal: 16,
      gap: 0,
    },
    statItem: {
      flex: 1,
      alignItems: "center",
    },
    statDivider: {
      width: 1,
      backgroundColor: colors.border,
    },
    statValue: {
      fontSize: 20,
      fontWeight: "700" as const,
      color: colors.primary,
      fontFamily: "Inter_700Bold",
    },
    statLabel: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      marginTop: 2,
    },
  });

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Feather name="user" size={36} color="#fff" />
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userId}>ID: {user.id}</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.section}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{currentDay}</Text>
                <Text style={styles.statLabel}>Current{"\n"}Day</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{completedDays}</Text>
                <Text style={styles.statLabel}>Days{"\n"}Completed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{30 - currentDay + 1}</Text>
                <Text style={styles.statLabel}>Days{"\n"}Remaining</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Plan Details</Text>
          <View style={styles.section}>
            <MenuItem icon="calendar" label="Start Date" value={startDate} />
            <View style={styles.divider} />
            <MenuItem icon="flag" label="End Date" value={endDate} />
            <View style={styles.divider} />
            <MenuItem icon="book-open" label="Plan Name" value={plan?.name ?? "30-Day Plan"} />
          </View>

          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.section}>
            <MenuItem icon="user" label="User ID" value={user.id} />
            <View style={styles.divider} />
            <MenuItem
              icon="log-out"
              label="Sign Out"
              onPress={handleLogout}
              destructive
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
