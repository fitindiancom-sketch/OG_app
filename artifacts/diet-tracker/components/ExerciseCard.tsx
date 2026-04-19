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

interface ExerciseCardProps {
  dayNumber: number;
  exerciseIndex: number;
  description: string;
}

export function ExerciseCard({ dayNumber, exerciseIndex, description }: ExerciseCardProps) {
  const colors = useColors();
  const { markComplete, savePhoto, isItemComplete, getPhotoUri } = usePlan();
  const completed = isItemComplete(dayNumber, "exercise", exerciseIndex);
  const photoUri = getPhotoUri(dayNumber, "exercise", exerciseIndex);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);

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
      Alert.alert("No Photo", "Please take or select a photo before submitting.");
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

  const displayPhoto = pendingPhoto ?? photoUri;
  const isAlreadySubmitted = submitted || (!pendingPhoto && !!photoUri);

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1.5,
      borderColor: isAlreadySubmitted ? "#f57c00" : completed ? "#ffd080" : colors.border,
      borderLeftWidth: 4,
      borderLeftColor: isAlreadySubmitted ? "#f57c00" : completed ? "#ffb300" : "#e0e0e0",
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
      backgroundColor: completed ? "#fff3e0" : colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    numberText: {
      fontSize: 13,
      fontWeight: "700" as const,
      color: completed ? "#f57c00" : colors.mutedForeground,
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
      borderColor: completed ? "#f57c00" : colors.border,
      backgroundColor: completed ? "#f57c00" : "transparent",
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
      backgroundColor: "#fff8f0",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: "#ffe0b2",
      borderStyle: "dashed",
      gap: 4,
    },
    photoPlaceholderText: {
      fontSize: 12,
      color: "#f57c00",
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
      backgroundColor: "#fff8f0",
      borderWidth: 1,
      borderColor: "#ffe0b2",
    },
    actionBtnText: {
      fontSize: 13,
      fontWeight: "600" as const,
      color: "#f57c00",
      fontFamily: "Inter_600SemiBold",
    },
    submitBtn: {
      backgroundColor: "#f57c00",
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
      backgroundColor: "#fff3e0",
      borderRadius: 10,
      marginTop: 2,
    },
    submittedText: {
      fontSize: 13,
      color: "#f57c00",
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
          <Text style={styles.photoSectionLabel}>Upload Proof Photo</Text>

          {displayPhoto ? (
            <Image source={{ uri: displayPhoto }} style={styles.photoPreview} resizeMode="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Feather name="camera" size={24} color="#f57c00" />
              <Text style={styles.photoPlaceholderText}>No photo selected yet</Text>
            </View>
          )}

          {!isAlreadySubmitted && (
            <View style={styles.actionRow}>
              <Pressable
                onPress={handleCamera}
                style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
                disabled={uploading}
              >
                <Feather name="camera" size={15} color="#f57c00" />
                <Text style={styles.actionBtnText}>Camera</Text>
              </Pressable>
              <Pressable
                onPress={handleGallery}
                style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
                disabled={uploading}
              >
                <Feather name="image" size={15} color="#f57c00" />
                <Text style={styles.actionBtnText}>Gallery</Text>
              </Pressable>
            </View>
          )}

          {!isAlreadySubmitted && (
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
          )}

          {isAlreadySubmitted && (
            <>
              <View style={styles.submittedRow}>
                <Feather name="check-circle" size={16} color="#f57c00" />
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
    </View>
  );
}
