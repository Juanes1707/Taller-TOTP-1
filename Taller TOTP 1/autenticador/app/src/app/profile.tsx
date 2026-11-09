import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "../http/apiFetch";
import { colors } from "../ui/colors";
import { useLlaveSelector } from "../redux/hooks";

export default function Profile() {
  const sessionUser = useLlaveSelector((state) => state.session.user);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    void (async () => {
      try {
        const response = await apiFetch("/api/perfil");
        if (!response.ok) throw new Error("No se pudo cargar el perfil.");
        setProfile(await response.json());
      } catch (value) { setError(value instanceof Error ? value.message : "Error al cargar el perfil."); }
      finally { setLoading(false); }
    })();
  }, []);
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Llave</Text></Pressable>
        <Text style={styles.title}>Perfil</Text>
        {loading ? <ActivityIndicator color={colors.accent} /> : error ? <Text style={styles.error}>{error}</Text> :
          <View style={styles.card}>
            <Text style={styles.label}>Correo electrónico</Text>
            <Text style={styles.value}>{sessionUser ?? String(profile?.email ?? profile?.usuario ?? "")}</Text>
          </View>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, content: { flex: 1, padding: 20 },
  back: { color: colors.accent, fontWeight: "800" }, title: { color: colors.text, fontSize: 30, fontWeight: "900", marginVertical: 18 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 18 },
  label: { color: colors.muted }, value: { color: colors.text, fontWeight: "800", marginTop: 6 },
  error: { color: colors.danger }
});
