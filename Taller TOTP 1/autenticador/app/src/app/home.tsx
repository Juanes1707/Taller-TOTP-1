import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../ui/colors";
import { apiFetch, refreshCount } from "../http/apiFetch";
import { readRefresh } from "../session/secureTokens";
import { closeLlaveSession } from "../oauth/login";
import { useLlaveSelector } from "../redux/hooks";

export default function Home() {
  const session = useLlaveSelector((state) => state.session);
  const [demoOpen, setDemoOpen] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [renewals, setRenewals] = useState(refreshCount);
  const [refreshLocal, setRefreshLocal] = useState<"Sí" | "No">("No");

  useEffect(() => {
    void readRefresh().then((value) => setRefreshLocal(value ? "Sí" : "No"));
  }, []);
  useEffect(() => {
    if (!session.accessToken) router.replace("/");
  }, [session.accessToken]);

  const triple = async () => {
    const settled = await Promise.allSettled([
      apiFetch("/api/perfil"), apiFetch("/api/perfil"), apiFetch("/api/perfil")
    ]);
    setResults(settled.map((item, index) => `${index + 1}: ${item.status === "fulfilled" && item.value.ok ? "✅" : "❌"}`));
    setRenewals(refreshCount);
  };
  const revoke = async () => {
    const refresh = await readRefresh();
    if (!refresh) return;
    await apiFetch("/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: refresh }) });
  };
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Llave</Text>
        <View style={styles.menu}>
          <Pressable style={styles.menuButton} onPress={() => router.push("/authenticator" as never)}><Text style={styles.menuText}>Authenticator</Text></Pressable>
          <Pressable style={styles.menuButton} onPress={() => router.push("/vault" as never)}><Text style={styles.menuText}>Bóveda</Text></Pressable>
          <Pressable style={styles.menuButton} onPress={() => router.push("/profile" as never)}><Text style={styles.menuText}>Perfil</Text></Pressable>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sesión</Text>
          <Text style={styles.label}>Usuario</Text><Text style={styles.value}>{session.user ?? "Sin sesión"}</Text>
          <Text style={styles.label}>Access token</Text><Text style={styles.value}>{session.accessToken?.slice(0, 16) ?? "No disponible"}</Text>
          <Text style={styles.label}>Refresh en SecureStore</Text><Text style={styles.value}>{refreshLocal}</Text>
        </View>
        <Pressable style={styles.logout} onPress={async () => { await closeLlaveSession(); router.replace("/"); }}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
        <Pressable onPress={() => setDemoOpen(!demoOpen)}><Text style={styles.demoTitle}>🧪 Herramientas de demostración</Text></Pressable>
        {demoOpen ? <View style={styles.demo}>
          <Pressable style={styles.demoButton} onPress={triple}><Text style={styles.demoButtonText}>Lanzar 3 peticiones simultáneas</Text></Pressable>
          {results.map((item) => <Text key={item} style={styles.result}>{item}</Text>)}
          <Text style={styles.result}>Renovaciones realizadas: {renewals}</Text>
          <Pressable style={styles.demoButton} onPress={revoke}><Text style={styles.demoButtonText}>Revocar refresh en el servidor</Text></Pressable>
        </View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, content: { padding: 20 },
  title: { fontSize: 34, fontWeight: "900", color: colors.accent }, menu: { flexDirection: "row", gap: 8, marginVertical: 18 },
  menuButton: { flex: 1, minHeight: 72, borderRadius: 10, borderWidth: 1, borderColor: colors.accent, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  menuText: { color: colors.accent, fontWeight: "800", textAlign: "center" },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 18 },
  cardTitle: { color: colors.text, fontWeight: "800", fontSize: 18, marginBottom: 10 }, label: { color: colors.muted, marginTop: 8 },
  value: { color: colors.text, fontWeight: "700" }, logout: { marginTop: 16, padding: 14, borderWidth: 1, borderColor: colors.danger, borderRadius: 8 },
  logoutText: { color: colors.danger, textAlign: "center", fontWeight: "800" }, demoTitle: { marginTop: 24, color: colors.text, fontWeight: "800" },
  demo: { marginTop: 10 }, demoButton: { marginTop: 8, padding: 12, borderRadius: 8, backgroundColor: colors.accent }, demoButtonText: { color: colors.white, textAlign: "center", fontWeight: "700" },
  result: { color: colors.text, marginTop: 6 }
});
