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
import { isMealUploadAllowed, isEndOfDay, MEAL_WINDOWS } from "@/utils/timeUtils";
import { Feather } from "@expo/vector-icons";

interface MealCardProps {
  dayNumber: number;
  mealType: "breakfast" | "lunch" | "dinner";
  description: string;
  label: string;
  icon: string;
  timeSlot: string;
}

export function MealCard({
  dayNumber,
  mealType,
  description,
  label,
  icon,
  timeSlot,
}: MealCardProps) {
  const colors = useColors();
  const { markComplete, savePhoto, isItemComplete, getPhotoUri, currentDay } = usePlan();
  const completed = isItemComplete(dayNumber, mealType);
  const photoUri = getPhotoUri(dayNumber, mealType);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);

  const { allowed: uploadAllowed, reason: lockReason } = isMealUploadAllowed(
    mealType,
    dayNumber,
    currentDay
  );
  const endOfDay = isEndOfDay();
  const isAlreadySubmitted = submitted || (!pendingPhoto && !!photoUri);
  const displayPhoto = pendingPhoto ?? photoUri;

  const handleToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newState = !completed;
    await markComplete(dayNumber, mealType, undefined, newState);
    if (!newState) {
      setPendingPhoto(null);
      setSubmitted(false);
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
        setPendingPhoto(result.assets[0].uri);
        setSubmitted(false);
      }
    } catch {
      Alert.alert("Error", "Could not open camera. Please try again.");
    }
  };

  const handleGallery = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission needed", "Please allow photo library access.");
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
        setPendingPhoto(result.assets[0].uri);
        setSubmitted(false);
      }
    } catch {
      Alert.alert("Error", "Could not open gallery. Please try again.");
    }
  };

  const handleSubmit = async () => {
    const uriToSave = pendingPhoto ?? photoUri;
    if (!uriToSave) {
      Alert.alert("No Photo", "Please take or select a photo before submitting.");
      return;
    }
    setUploading(true);
    try {
      await savePhoto(dayNumber, mealType, undefined, uriToSave);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
      setPendingPhoto(null);
    } catch {
      Alert.alert("Error", "Could not submit. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1.5,
      borderColor: isAlreadySubmitted && completed
        ? colors.primary
        : completed
        ? "#a5d6b0"
        : colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: completed ? colors.primary : colors.secondary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    titleColumn: {
      flex: 1,
    },
    mealLabel: {
      fontSize: 15,
      fontWeight: "700" as const,
      color: completed ? colors.primary : colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    mealTime: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginTop: 1,
    },
    checkButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 2,
      borderColor: completed ? colors.primary : colors.border,
      backgroundColor: completed ? colors.primary : "transparent",
      alignItems: "center",
      justifyContent: "center",
    },
    description: {
      fontSize: 13,
      color: colors.mutedForeground,
      lineHeight: 21,
      fontFamily: "Inter_400Regular",
    },
    checkboxHint: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontStyle: "italic",
      marginTop: 6,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    // --- LOCKED STATE ---
    lockedBox: {
      marginTop: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: "#f5f5f5",
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: "#e0e0e0",
    },
    lockedText: {
      flex: 1,
      fontSize: 12,
      color: "#9e9e9e",
      fontFamily: "Inter_400Regular",
      lineHeight: 18,
    },
    lockedBold: {
      fontFamily: "Inter_600SemiBold",
      color: "#757575",
    },
    // --- END OF DAY BANNER ---
    endOfDayBanner: {
      marginTop: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "#fff3e0",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    endOfDayText: {
      fontSize: 12,
      color: "#e65100",
      fontFamily: "Inter_500Medium",
      flex: 1,
    },
    // --- PHOTO SECTION ---
    photoSectionLabel: {
      fontSize: 13,
      fontWeight: "600" as const,
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      marginBottom: 10,
    },
    photoPreview: {
      width: "100%",
      height: 180,
      borderRadius: 10,
      marginBottom: 10,
      backgroundColor: colors.muted,
    },
    photoPlaceholder: {
      width: "100%",
      height: 110,
      borderRadius: 10,
      marginBottom: 10,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: colors.border,
      borderStyle: "dashed",
      gap: 5,
    },
    photoPlaceholderText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    actionRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 10,
    },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.secondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionBtnText: {
      fontSize: 13,
      fontWeight: "600" as const,
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
    },
    submitBtn: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    submitBtnText: {
      fontSize: 14,
      fontWeight: "700" as const,
      color: "#fff",
      fontFamily: "Inter_700Bold",
    },
    submittedRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: "#e8f5ec",
      borderRadius: 10,
    },
    submittedText: {
      fontSize: 13,
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
    },
    changePhotoBtn: {
      marginTop: 6,
      alignSelf: "center",
    },
    changePhotoText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      textDecorationLine: "underline",
    },
  });

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.iconContainer}>
          <Text style={{ fontSize: 20 }}>{icon}</Text>
        </View>
        <View style={styles.titleColumn}>
          <Text style={styles.mealLabel}>{label}</Text>
          <Text style={styles.mealTime}>{timeSlot}</Text>
        </View>
        <Pressable
          onPress={handleToggle}
          style={({ pressed }) => [styles.checkButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          {completed && <Feather name="check" size={16} color="#fff" />}
        </Pressable>
      </View>

      {/* Description */}
      <Text style={styles.description}>{description}</Text>

      {!completed && (
        <Text style={styles.checkboxHint}>Tick the checkbox once you complete this meal</Text>
      )}

      {/* Photo section — only when checkbox is ticked */}
      {completed && (
        <>
          <View style={styles.divider} />

          {/* CASE 1: Upload is NOT allowed yet (time window not open) */}
          {!uploadAllowed && (
            <>
              <View style={styles.lockedBox}>
                <Feather name="clock" size={18} color="#9e9e9e" />
                <Text style={styles.lockedText}>
                  <Text style={styles.lockedBold}>Photo upload locked. </Text>
                  {lockReason}
                  {"\n"}Upload opens at{" "}
                  <Text style={styles.lockedBold}>
                    {MEAL_WINDOWS[mealType].label}
                  </Text>{" "}
                  or after 9:00 PM.
                </Text>
              </View>
            </>
          )}

          {/* CASE 2: End-of-day catch-up banner */}
          {uploadAllowed && endOfDay && !isAlreadySubmitted && (
            <View style={styles.endOfDayBanner}>
              <Feather name="moon" size={14} color="#e65100" />
              <Text style={styles.endOfDayText}>
                End-of-day mode — all sections are now open. Upload your missed photos!
              </Text>
            </View>
          )}

          {/* CASE 3: Upload is allowed */}
          {uploadAllowed && (
            <>
              <Text style={styles.photoSectionLabel}>Upload Proof Photo</Text>

              {displayPhoto ? (
                <Image
                  source={{ uri: displayPhoto }}
                  style={styles.photoPreview}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Feather name="image" size={28} color={colors.mutedForeground} />
                  <Text style={styles.photoPlaceholderText}>No photo selected yet</Text>
                </View>
              )}

              {!isAlreadySubmitted && (
                <>
                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={handleCamera}
                      style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
                      disabled={uploading}
                    >
                      <Feather name="camera" size={15} color={colors.primary} />
                      <Text style={styles.actionBtnText}>Camera</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleGallery}
                      style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
                      disabled={uploading}
                    >
                      <Feather name="image" size={15} color={colors.primary} />
                      <Text style={styles.actionBtnText}>Gallery</Text>
                    </Pressable>
                  </View>
                  <Pressable
                    onPress={handleSubmit}
                    style={({ pressed }) => [
                      styles.submitBtn,
                      { opacity: pressed || uploading ? 0.8 : 1 },
                    ]}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Feather name="send" size={16} color="#fff" />
                        <Text style={styles.submitBtnText}>Submit</Text>
                      </>
                    )}
                  </Pressable>
                </>
              )}

              {isAlreadySubmitted && (
                <>
                  <View style={styles.submittedRow}>
                    <Feather name="check-circle" size={16} color={colors.primary} />
                    <Text style={styles.submittedText}>Photo submitted successfully</Text>
                  </View>
                  <Pressable
                    style={styles.changePhotoBtn}
                    onPress={() => {
                      setSubmitted(false);
                      setPendingPhoto(null);
                    }}
                  >
                    <Text style={styles.changePhotoText}>Change photo</Text>
                  </Pressable>
                </>
              )}
            </>
          )}
        </>
      )}
    </View>
  );
}
