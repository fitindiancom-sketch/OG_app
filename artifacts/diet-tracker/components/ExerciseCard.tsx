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

  const handleToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await markComplete(dayNumber, "exercise", exerciseIndex, !completed);
  };

  const handleUploadPhoto = async () => {
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
        setUploading(true);
        await savePhoto(dayNumber, "exercise", exerciseIndex, result.assets[0].uri);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setUploading(false);
      }
    } catch {
      setUploading(false);
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
        setUploading(true);
        await savePhoto(dayNumber, "exercise", exerciseIndex, result.assets[0].uri);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setUploading(false);
      }
    } catch {
      setUploading(false);
    }
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: completed ? "#4caf72" : colors.border,
      borderLeftWidth: 4,
      borderLeftColor: completed ? "#2d7d46" : "#f57c00",
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    numberBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: completed ? colors.primary : "#fff3e0",
      alignItems: "center",
      justifyContent: "center",
    },
    numberText: {
      fontSize: 12,
      fontWeight: "700" as const,
      color: completed ? "#fff" : "#f57c00",
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
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: completed ? colors.primary : colors.border,
      backgroundColor: completed ? colors.primary : "transparent",
      alignItems: "center",
      justifyContent: "center",
    },
    photoPreview: {
      width: "100%",
      height: 120,
      borderRadius: 8,
      marginTop: 10,
      marginBottom: 8,
      backgroundColor: colors.muted,
    },
    actionRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 10,
    },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      paddingVertical: 7,
      borderRadius: 8,
      backgroundColor: "#fff3e0",
    },
    actionBtnText: {
      fontSize: 11,
      fontWeight: "600" as const,
      color: "#f57c00",
      fontFamily: "Inter_600SemiBold",
    },
  });

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>{exerciseIndex + 1}</Text>
        </View>
        <Text style={styles.descriptionText}>{description}</Text>
        <Pressable onPress={handleToggle} style={({ pressed }) => [styles.checkButton, { opacity: pressed ? 0.7 : 1 }]}>
          {completed && <Feather name="check" size={16} color={colors.primaryForeground} />}
        </Pressable>
      </View>

      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
      ) : null}

      <View style={styles.actionRow}>
        <Pressable onPress={handleCamera} style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator size="small" color="#f57c00" />
          ) : (
            <>
              <Feather name="camera" size={13} color="#f57c00" />
              <Text style={styles.actionBtnText}>Camera</Text>
            </>
          )}
        </Pressable>
        <Pressable onPress={handleUploadPhoto} style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]} disabled={uploading}>
          <>
            <Feather name="image" size={13} color="#f57c00" />
            <Text style={styles.actionBtnText}>Gallery</Text>
          </>
        </Pressable>
      </View>
    </View>
  );
}
