import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../ui/colors";
import { isValidBase32 } from "../otp/base32";
import { readOtpSecret, saveOtpSecret, clearOtpSecret, readQrAccount, clearQrAccount } from "../session/secureTokens";
import { useOtp } from "../otp/useOtp";
import { ProgressBar } from "../components/ProgressBar";
import { useLlaveSelector } from "../redux/hooks";

export default function Authenticator() {
  const user = useLlaveSelector((state) => state.session.user);
  const [secret, setSecret] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [qrAccount, setQrAccount] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { code, remaining } = useOtp(secret);

  useEffect(() => {
    void readOtpSecret().then(setSecret);
    void readQrAccount().then(setQrAccount);
  }, []);

  const save = async () => {
    if (!isValidBase32(input)) { setError("Base32 inválida: usa solo A-Z y 2-7."); return; }
    const normalized = input.trim().replace(/\s/g, "").replace(/=+$/, "").toUpperCase();
    await saveOtpSecret(normalized);
    await clearQrAccount();
    setQrAccount(null);
    setSecret(normalized);
    setError("");
  };
  const clear = async () => {
    await clearOtpSecret(); await clearQrAccount();
    setSecret(null); setQrAccount(null); setInput("");
  };
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Llave</Text></Pressable>
          <Text style={styles.title}>Authenticator</Text>
        </View>
        {!secret ? <>
          <Pressable style={styles.scan} onPress={() => router.push("/scan" as never)}><Text style={styles.scanText}>Escanear QR</Text></Pressable>
          <Text style={styles.or}>o pega una semilla Base32</Text>
          <TextInput value={input} onChangeText={setInput} autoCapitalize="characters" placeholder="Semilla Base32"
            placeholderTextColor={colors.muted} style={styles.input} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.save} onPress={save}><Text style={styles.saveText}>Guardar cuenta</Text></Pressable>
        </> : <View style={styles.codeCard}>
          <Text style={styles.account}>{user ? user : qrAccount ? `Cuenta del QR: ${qrAccount}` : "Cuenta Base32"}</Text>
          <Text style={styles.code}>{code.split("").join("")}</Text>
          <ProgressBar remaining={remaining} />
          <Text style={styles.seconds}>{remaining} segundos</Text>
          <Pressable style={styles.clear} onPress={clear}><Text style={styles.clearText}>Borrar cuenta</Text></Pressable>
        </View>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, content: { padding: 20 },
  header: { marginBottom: 18 }, back: { color: colors.accent, fontWeight: "800" },
  title: { color: colors.text, fontSize: 30, fontWeight: "900", marginTop: 8 },
  scan: { backgroundColor: colors.accent, borderRadius: 10, padding: 16 }, scanText: { color: colors.white, textAlign: "center", fontWeight: "800" },
  or: { color: colors.muted, textAlign: "center", marginVertical: 12 }, input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, backgroundColor: colors.white, fontFamily: "Courier New" },
  error: { color: colors.danger, marginTop: 8 }, save: { backgroundColor: colors.accent, borderRadius: 10, padding: 15, marginTop: 14 }, saveText: { color: colors.white, textAlign: "center", fontWeight: "800" },
  codeCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.white, padding: 20 },
  account: { color: colors.text, textAlign: "center", fontWeight: "700" }, code: { color: colors.text, fontFamily: "Courier New", fontSize: 44, letterSpacing: 6, textAlign: "center", marginVertical: 20 },
  seconds: { color: colors.muted, textAlign: "center", marginTop: 8 }, clear: { marginTop: 18, alignSelf: "center", borderWidth: 1, borderColor: colors.danger, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  clearText: { color: colors.danger, fontWeight: "800" }
});
