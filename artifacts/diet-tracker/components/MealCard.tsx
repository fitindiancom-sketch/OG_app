import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { usePlan } from "@/context/PlanContext";
import { Feather } from "@expo/vector-icons";

interface MealCardProps {
  dayNumber: number;
  mealType: "breakfast" | "lunch" | "dinner";
  description: string;
  label: string;
  icon: string;
}

const MEAL_TIMES: Record<string, string> = {
  breakfast: "7:00 – 9:00 AM",
  lunch: "12:00 – 2:00 PM",
  dinner: "7:00 – 9:00 PM",
};

export function MealCard({ dayNumber, mealType, description, label, icon }: MealCardProps) {
  const colors = useColors();
  const { markComplete, savePhoto, isItemComplete, getPhotoUri } = usePlan();
  const completed = isItemComplete(dayNumber, mealType);
  const photoUri = getPhotoUri(dayNumber, mealType);
  const [uploading, setUploading] = useState(false);

  const handleToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await markComplete(dayNumber, mealType, undefined, !completed);
  };

  const handleUploadPhoto = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission needed", "Please allow photo library access to upload proof.");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        await savePhoto(dayNumber, mealType, undefined, result.assets[0].uri);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setUploading(false);
      }
    } catch {
      setUploading(false);
      Alert.alert("Error", "Could not upload photo. Please try again.");
    }
  };

  const handleCamera = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission needed", "Please allow camera access to take a photo.");
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        await savePhoto(dayNumber, mealType, undefined, result.assets[0].uri);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setUploading(false);
      }
    } catch {
      setUploading(false);
      Alert.alert("Error", "Could not take photo. Please try again.");
    }
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: completed ? colors.primary : colors.border,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: completed ? colors.primary : colors.secondary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    titleColumn: {
      flex: 1,
    },
    mealLabel: {
      fontSize: 14,
      fontWeight: "700" as const,
      color: completed ? colors.primary : colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    mealTime: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    checkButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: completed ? colors.primary : colors.border,
      backgroundColor: completed ? colors.primary : "transparent",
      alignItems: "center",
      justifyContent: "center",
    },
    description: {
      fontSize: 13,
      color: colors.mutedForeground,
      lineHeight: 20,
      fontFamily: "Inter_400Regular",
      marginBottom: 12,
    },
    photoPreview: {
      width: "100%",
      height: 160,
      borderRadius: 8,
      marginBottom: 10,
      backgroundColor: colors.muted,
    },
    actionRow: {
      flexDirection: "row",
      gap: 8,
    },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.secondary,
    },
    actionBtnText: {
      fontSize: 12,
      fontWeight: "600" as const,
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
    },
    completedBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 8,
    },
    completedText: {
      fontSize: 12,
      color: colors.primary,
      fontFamily: "Inter_500Medium",
    },
  });

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconContainer}>
          <Text style={{ fontSize: 18 }}>{icon}</Text>
        </View>
        <View style={styles.titleColumn}>
          <Text style={styles.mealLabel}>{label}</Text>
          <Text style={styles.mealTime}>{MEAL_TIMES[mealType]}</Text>
        </View>
        <Pressable onPress={handleToggle} style={({ pressed }) => [styles.checkButton, { opacity: pressed ? 0.7 : 1 }]}>
          {completed && <Feather name="check" size={16} color={colors.primaryForeground} />}
        </Pressable>
      </View>

      <Text style={styles.description}>{description}</Text>

      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
      ) : null}

      <View style={styles.actionRow}>
        <Pressable
          onPress={handleCamera}
          style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Feather name="camera" size={14} color={colors.primary} />
              <Text style={styles.actionBtnText}>Camera</Text>
            </>
          )}
        </Pressable>
        <Pressable
          onPress={handleUploadPhoto}
          style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
          disabled={uploading}
        >
          <>
            <Feather name="image" size={14} color={colors.primary} />
            <Text style={styles.actionBtnText}>Gallery</Text>
          </>
        </Pressable>
      </View>

      {completed && (
        <View style={styles.completedBadge}>
          <Feather name="check-circle" size={12} color={colors.primary} />
          <Text style={styles.completedText}>Completed</Text>
        </View>
      )}
    </View>
  );
}
