import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../ui/colors";
import { beginLlaveLogin, setSimulateCsrf } from "../oauth/login";
import { plainFetch } from "../http/apiFetch";

export default function Welcome() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [csrf, setCsrf] = useState(false);
  const login = async () => {
    setLoading(true); setError("");
    try { await beginLlaveLogin(); router.replace("/home" as never); }
    catch (value) { setError(value instanceof Error ? value.message : "No se pudo iniciar sesión."); }
    finally { setLoading(false); }
  };
  const testConnection = async () => {
    try {
      const response = await plainFetch("/health");
      setError(response.ok ? "Conexión disponible." : "El servidor no responde.");
    } catch { setError("No se pudo conectar con Llave."); }
  };
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.brand}>Llave</Text>
        <Text style={styles.subtitle}>Acceso seguro y autenticación personal</Text>
        <Pressable style={styles.primary} disabled={loading} onPress={login}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Iniciar sesión</Text>}
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => router.push("/authenticator" as never)}>
          <Text style={styles.secondaryText}>Abrir Authenticator sin sesión</Text>
        </Pressable>
        <Pressable style={styles.connection} onPress={testConnection}><Text style={styles.connectionText}>Probar conexión</Text></Pressable>
        {error ? <Text style={[styles.message, error === "Conexión disponible." && styles.success]}>{error}</Text> : null}
        <View style={styles.demo}>
          <Text style={styles.demoTitle}>🧪 Herramientas de demostración</Text>
          <View style={styles.switchRow}><Text style={styles.switchText}>Simular state alterado</Text>
            <Switch value={csrf} onValueChange={(value) => { setCsrf(value); setSimulateCsrf(value); }} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, content: { flex: 1, padding: 24, justifyContent: "center" },
  brand: { color: colors.accent, fontSize: 44, fontWeight: "900" }, subtitle: { color: colors.text, fontSize: 18, marginBottom: 28 },
  primary: { height: 54, borderRadius: 10, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  primaryText: { color: colors.white, fontWeight: "800", fontSize: 16 }, secondary: { height: 54, borderRadius: 10, borderWidth: 1, borderColor: colors.accent, alignItems: "center", justifyContent: "center", marginTop: 12 },
  secondaryText: { color: colors.accent, fontWeight: "800" }, connection: { marginTop: 16, alignSelf: "center", padding: 8 },
  connectionText: { color: colors.muted }, message: { color: colors.danger, textAlign: "center", marginTop: 8 }, success: { color: colors.accent },
  demo: { marginTop: 28, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }, demoTitle: { color: colors.text, fontWeight: "800" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }, switchText: { color: colors.text }
});
