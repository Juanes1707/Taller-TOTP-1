import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { handleLlaveCallback } from "../../oauth/login";
import { colors } from "../../ui/colors";

export default function Callback() {
  const params = useLocalSearchParams<{ code?: string; state?: string }>();
  const [message, setMessage] = useState("Procesando…");
  useEffect(() => {
    const url = new URLSearchParams();
    if (params.code) url.set("code", params.code);
    if (params.state) url.set("state", params.state);
    void handleLlaveCallback(`unisabana-auth://oauth/callback?${url.toString()}`)
      .then(() => router.replace("/home" as never))
      .catch((error: unknown) => { setMessage(error instanceof Error ? error.message : "Inicio de sesión cancelado."); });
  }, [params.code, params.state]);
  return <View style={styles.container}><ActivityIndicator color={colors.accent} /><Text style={styles.text}>{message}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  text: { color: colors.text, marginTop: 12, textAlign: "center", paddingHorizontal: 20 }
});
