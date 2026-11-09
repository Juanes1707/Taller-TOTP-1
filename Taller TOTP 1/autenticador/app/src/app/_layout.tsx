import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { Provider } from "react-redux";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { store } from "../redux/store";
import { restoreLlaveSession } from "../oauth/login";
import { colors } from "../ui/colors";

function Shell() {
  const [restoring, setRestoring] = useState(true);
  useEffect(() => {
    let active = true;
    void restoreLlaveSession().finally(() => {
      if (!active) return;
      setRestoring(false);
      if (store.getState().session.accessToken) router.replace("/home" as never);
    });
    return () => { active = false; };
  }, []);
  if (restoring) {
    return (
      <SafeAreaView style={styles.loading}>
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Restaurando sesión…</Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="home" />
      <Stack.Screen name="authenticator" />
      <Stack.Screen name="scan" options={{ presentation: "modal", title: "Escanear QR" }} />
      <Stack.Screen name="vault" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="oauth/callback" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider><Provider store={store}><Shell /></Provider></SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background },
  loadingCard: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, color: colors.text, fontWeight: "700" }
});
