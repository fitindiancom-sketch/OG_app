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
import { isExerciseUploadAllowed, isEndOfDay, EXERCISE_WINDOWS } from "@/utils/timeUtils";
import { Feather } from "@expo/vector-icons";

interface ExerciseCardProps {
  dayNumber: number;
  exerciseIndex: number;
  description: string;
}

export function ExerciseCard({ dayNumber, exerciseIndex, description }: ExerciseCardProps) {
  const colors = useColors();
  const { markComplete, savePhoto, isItemComplete, getPhotoUri, currentDay, isStarted } = usePlan();
  const completed = isItemComplete(dayNumber, "exercise", exerciseIndex);
  const photoUri = getPhotoUri(dayNumber, "exercise", exerciseIndex);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);

  const baseGate = isExerciseUploadAllowed(exerciseIndex, dayNumber, currentDay);
  const { allowed: uploadAllowed, reason: lockReason } = !isStarted
    ? { allowed: false, reason: "Tap 'Start Diet' on the home page to unlock uploads." }
    : baseGate;
  const endOfDay = isEndOfDay();
  const isAlreadySubmitted = submitted || (!pendingPhoto && !!photoUri);
  const displayPhoto = pendingPhoto ?? photoUri;

  // Map exercise to its window label
  const windowIdx = exerciseIndex <= 1 ? 0 : 1;
  const windowLabel = EXERCISE_WINDOWS[windowIdx].label;

  const handleToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newState = !completed;
    await markComplete(dayNumber, "exercise", exerciseIndex, newState);
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
          Alert.alert("Permission needed", "Please allow camera access.");
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
      Alert.alert("Error", "Could not open camera.");
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
      Alert.alert("Error", "Could not open gallery.");
    }
  };

  const handleSubmit = async () => {
    const uriToSave = pendingPhoto ?? photoUri;
    if (!uriToSave) {
      Alert.alert("No Photo", "Please take or select a photo first.");
      return;
    }
    setUploading(true);
    try {
      await savePhoto(dayNumber, "exercise", exerciseIndex, uriToSave);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
      setPendingPhoto(null);
    } catch {
      Alert.alert("Error", "Could not submit. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const ORANGE = "#f57c00";
  const ORANGE_LIGHT = "#fff3e0";
  const ORANGE_BORDER = "#ffe0b2";

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1.5,
      borderColor: isAlreadySubmitted && completed ? ORANGE : completed ? ORANGE_BORDER : colors.border,
      borderLeftWidth: 4,
      borderLeftColor: isAlreadySubmitted && completed ? ORANGE : completed ? "#ffb300" : "#e0e0e0",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    numberBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: completed ? ORANGE_LIGHT : colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    numberText: {
      fontSize: 13,
      fontWeight: "700" as const,
      color: completed ? ORANGE : colors.mutedForeground,
      fontFamily: "Inter_700Bold",
    },
    descriptionText: {
      flex: 1,
      fontSize: 13,
      color: colors.foreground,
      fontFamily: "Inter_500Medium",
      lineHeight: 20,
    },
    checkButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 2,
      borderColor: completed ? ORANGE : colors.border,
      backgroundColor: completed ? ORANGE : "transparent",
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxHint: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontStyle: "italic",
      marginTop: 8,
      paddingLeft: 40,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    lockedBox: {
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
    endOfDayBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "#fff3e0",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 10,
    },
    endOfDayText: {
      fontSize: 12,
      color: "#e65100",
      fontFamily: "Inter_500Medium",
      flex: 1,
    },
    photoSectionLabel: {
      fontSize: 13,
      fontWeight: "600" as const,
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      marginBottom: 10,
    },
    photoPreview: {
      width: "100%",
      height: 160,
      borderRadius: 10,
      marginBottom: 10,
      backgroundColor: colors.muted,
    },
    photoPlaceholder: {
      width: "100%",
      height: 100,
      borderRadius: 10,
      marginBottom: 10,
      backgroundColor: ORANGE_LIGHT,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: ORANGE_BORDER,
      borderStyle: "dashed",
      gap: 4,
    },
    photoPlaceholderText: {
      fontSize: 12,
      color: ORANGE,
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
      backgroundColor: ORANGE_LIGHT,
      borderWidth: 1,
      borderColor: ORANGE_BORDER,
    },
    actionBtnText: {
      fontSize: 13,
      fontWeight: "600" as const,
      color: ORANGE,
      fontFamily: "Inter_600SemiBold",
    },
    submitBtn: {
      backgroundColor: ORANGE,
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
      backgroundColor: ORANGE_LIGHT,
      borderRadius: 10,
    },
    submittedText: {
      fontSize: 13,
      color: ORANGE,
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
      <View style={styles.headerRow}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>{exerciseIndex + 1}</Text>
        </View>
        <Text style={styles.descriptionText}>{description}</Text>
        <Pressable
          onPress={handleToggle}
          style={({ pressed }) => [styles.checkButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          {completed && <Feather name="check" size={16} color="#fff" />}
        </Pressable>
      </View>

      {!completed && (
        <Text style={styles.checkboxHint}>Tick once you complete this activity</Text>
      )}

      {completed && (
        <>
          <View style={styles.divider} />

          {/* Locked — outside time window */}
          {!uploadAllowed && (
            <View style={styles.lockedBox}>
              <Feather name="clock" size={18} color="#9e9e9e" />
              <Text style={styles.lockedText}>
                <Text style={styles.lockedBold}>Photo upload locked. </Text>
                {lockReason}
                {"\n"}Upload window:{" "}
                <Text style={styles.lockedBold}>{windowLabel}</Text>
                {" "}or after 9:00 PM.
              </Text>
            </View>
          )}

          {/* End-of-day banner */}
          {uploadAllowed && endOfDay && !isAlreadySubmitted && (
            <View style={styles.endOfDayBanner}>
              <Feather name="moon" size={14} color="#e65100" />
              <Text style={styles.endOfDayText}>
                End-of-day mode — upload your missed photo now!
              </Text>
            </View>
          )}

          {/* Allowed — show upload UI */}
          {uploadAllowed && (
            <>
              <Text style={styles.photoSectionLabel}>Upload Proof Photo</Text>

              {displayPhoto ? (
                <Image source={{ uri: displayPhoto }} style={styles.photoPreview} resizeMode="cover" />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Feather name="camera" size={24} color={ORANGE} />
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
                      <Feather name="camera" size={15} color={ORANGE} />
                      <Text style={styles.actionBtnText}>Camera</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleGallery}
                      style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
                      disabled={uploading}
                    >
                      <Feather name="image" size={15} color={ORANGE} />
                      <Text style={styles.actionBtnText}>Gallery</Text>
                    </Pressable>
                  </View>
                  <Pressable
                    onPress={handleSubmit}
                    style={({ pressed }) => [styles.submitBtn, { opacity: pressed || uploading ? 0.8 : 1 }]}
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
                    <Feather name="check-circle" size={16} color={ORANGE} />
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
