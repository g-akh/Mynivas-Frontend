import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, ViewStyle } from "react-native";
import { theme } from "../../theme";

interface SkeletonBoxProps { width?: number | string; height?: number; style?: ViewStyle; borderRadius?: number; }

export function SkeletonBox({ width = "100%", height = 16, style, borderRadius = 4 }: SkeletonBoxProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.box,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <SkeletonBox width={48} height={48} borderRadius={24} />
        <View style={{ flex: 1, gap: 8, marginLeft: 12 }}>
          <SkeletonBox height={14} width="70%" />
          <SkeletonBox height={12} width="40%" />
        </View>
      </View>
      <SkeletonBox height={12} style={{ marginTop: 12 }} />
      <SkeletonBox height={12} width="80%" style={{ marginTop: 6 }} />
    </View>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={{ gap: theme.spacing.md, padding: theme.spacing.md }}>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: theme.colors.border },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  row: { flexDirection: "row", alignItems: "center" },
});
