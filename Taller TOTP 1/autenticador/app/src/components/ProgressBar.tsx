import { useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { colors } from "../ui/colors";

export function ProgressBar({ remaining }: { remaining: number }) {
  const [width] = useState(() => new Animated.Value(1));
  useEffect(() => {
    Animated.timing(width, { toValue: remaining / 30, duration: 220, useNativeDriver: false }).start();
  }, [remaining, width]);
  const isWarning = remaining <= 5;
  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, {
        width: width.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
        backgroundColor: isWarning ? colors.amber : colors.accent
      }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, width: "100%", backgroundColor: colors.border, borderRadius: 8, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 8 }
});
