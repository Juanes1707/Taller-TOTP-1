import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "../http/apiFetch";
import { colors } from "../ui/colors";
import { useLlaveDispatch, useLlaveSelector } from "../redux/hooks";
import { MfaSheet } from "../components/MfaSheet";
import { setElevated, clearElevated, setStepUp } from "../redux/mfaSlice";
import { verifyLlaveMfa } from "../oauth/login";
import { readOtpSecret } from "../session/secureTokens";
import { generateOtp } from "../otp/totp";

function decodeExp(token: string | null): number | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch { return null; }
}

export default function Vault() {
  const dispatch = useLlaveDispatch();
  const session = useLlaveSelector((state) => state.session);
  const mfa = useLlaveSelector((state) => state.mfa);
  const [sheet, setSheet] = useState(false);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [hasSecret, setHasSecret] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [demoOpen, setDemoOpen] = useState(false);
  const [replayMessage, setReplayMessage] = useState("");

  const openVault = useCallback(async () => {
    setError("");
    try {
      const response = await apiFetch("/api/boveda-critica");
      if (response.status === 403) {
        const required = await response.json() as { step_up_token?: string };
        if (required.step_up_token) dispatch(setStepUp(required.step_up_token));
        setSheet(true);
        return;
      }
      if (!response.ok) throw new Error("No se pudo abrir la bóveda.");
      setData(await response.json());
    } catch (value) { setError(value instanceof Error ? value.message : "No se pudo abrir la bóveda."); }
  }, [dispatch]);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      const secret = await readOtpSecret();
      if (!active) return;
      setHasSecret(Boolean(secret));
      await openVault();
    };
    void initialize();
    return () => { active = false; };
  }, [openVault]);
  useEffect(() => {
    const timer = setInterval(() => {
      const exp = decodeExp(mfa.elevatedToken);
      if (!exp) { setSeconds(0); return; }
      const remaining = Math.max(0, exp - Math.floor(Date.now() / 1000));
      setSeconds(remaining);
      if (remaining === 0) { dispatch(clearElevated()); setData(null); }
    }, 1000);
    return () => clearInterval(timer);
  }, [mfa.elevatedToken, dispatch]);

  if (!session.accessToken) {
    router.replace("/");
    return null;
  }

  const verify = async (code: string) => {
    if (!mfa.stepUpToken) throw new Error("No hay token de elevación.");
    const result = await verifyLlaveMfa(mfa.stepUpToken, code);
    dispatch(setElevated({ token: result.elevatedToken, stepUpToken: mfa.stepUpToken, code }));
    setSheet(false);
    await openVault();
  };

  const useAuthenticator = async () => {
    const secret = await readOtpSecret();
    if (!secret || !mfa.stepUpToken) return;
    const code = await generateOtp(secret);
    await verify(code);
  };

  const resend = async () => {
    if (!mfa.lastCode) return;
    try {
      await verifyLlaveMfa(mfa.lastCode.stepUpToken, mfa.lastCode.code);
      setReplayMessage("Respuesta recibida: 409 esperado para el replay.");
    } catch (value) { setReplayMessage(`${value instanceof Error ? value.message : "Error desconocido"} · transcurridos: ${Math.floor((Date.now() - mfa.lastCode.at) / 1000)} s`); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Llave</Text></Pressable>
        <Text style={styles.title}>Bóveda</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {data ? <>
          <Text style={styles.unlocked}>Estado: desbloqueado</Text>
          <Text style={styles.counter}>Acceso elevado: {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</Text>
          <View style={styles.card}><Text style={styles.cardLabel}>Contenido protegido</Text><Text style={styles.cardValue}>Saldo: {String(data.saldo)}</Text></View>
          <Pressable onPress={() => setDemoOpen(!demoOpen)}><Text style={styles.demoTitle}>🧪 Herramientas de demostración</Text></Pressable>
          {demoOpen ? <View style={styles.demo}>
            <Pressable style={styles.demoButton} onPress={resend}><Text style={styles.demoButtonText}>Reenviar último código</Text></Pressable>
            {replayMessage ? <Text style={styles.replay}>{replayMessage}</Text> : null}
          </View> : null}
        </> : <View style={styles.blocked}>
          <Text style={styles.blockedTitle}>Contenido protegido con 2FA</Text>
          <Pressable style={styles.openButton} onPress={() => setSheet(true)}><Text style={styles.openText}>Desbloquear</Text></Pressable>
        </View>}
      </ScrollView>
      <MfaSheet visible={sheet} onCancel={() => setSheet(false)} onVerify={verify} hasAuthenticator={hasSecret} onUseAuthenticator={useAuthenticator} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, content: { padding: 20 },
  back: { color: colors.accent, fontWeight: "800" }, title: { color: colors.text, fontSize: 30, fontWeight: "900", marginVertical: 18 },
  error: { color: colors.danger }, unlocked: { color: colors.accent, fontWeight: "800" }, counter: { color: colors.muted, marginTop: 6 },
  card: { marginTop: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 18 },
  cardLabel: { color: colors.muted }, cardValue: { color: colors.text, fontSize: 22, fontWeight: "900", marginTop: 8 },
  blocked: { marginTop: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, borderRadius: 12, padding: 24 },
  blockedTitle: { color: colors.text, textAlign: "center", fontWeight: "800" }, openButton: { marginTop: 16, backgroundColor: colors.accent, borderRadius: 8, padding: 13 },
  openText: { color: colors.white, textAlign: "center", fontWeight: "800" }, demoTitle: { color: colors.text, fontWeight: "800", marginTop: 24 },
  demo: { marginTop: 10 }, demoButton: { backgroundColor: colors.accent, borderRadius: 8, padding: 12 }, demoButtonText: { color: colors.white, textAlign: "center", fontWeight: "700" },
  replay: { color: colors.text, marginTop: 8 }
});
