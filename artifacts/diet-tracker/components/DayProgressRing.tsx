import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

interface DayProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  dayNumber?: number;
}

export function DayProgressRing({ percent, size = 56, strokeWidth = 4, dayNumber }: DayProgressRingProps) {
  const colors = useColors();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  const styles = StyleSheet.create({
    container: {
      width: size,
      height: size,
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      position: "absolute",
      fontSize: dayNumber ? 13 : 11,
      fontWeight: "700" as const,
      color: percent === 100 ? colors.primary : colors.foreground,
      fontFamily: "Inter_700Bold",
    },
  });

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.muted}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={percent === 100 ? colors.primary : colors.accent}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <Text style={styles.label}>{dayNumber ?? `${percent}%`}</Text>
    </View>
  );
}
