import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { colors } from "../ui/colors";

interface Props {
  visible: boolean;
  onCancel: () => void;
  onVerify: (code: string) => Promise<void>;
  hasAuthenticator: boolean;
  onUseAuthenticator: () => void;
}

export function MfaSheet({ visible, onCancel, onVerify, hasAuthenticator, onUseAuthenticator }: Props) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const submit = async () => {
    if (!/^\d{6}$/.test(code)) return;
    try { await onVerify(code); setMessage(""); }
    catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo verificar el código."); }
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.icon}>▣</Text>
          <Text style={styles.title}>Verificación Llave</Text>
          <TextInput value={code} onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad" textContentType="oneTimeCode" maxLength={6} autoFocus placeholder="Código de 6 dígitos"
            placeholderTextColor={colors.muted} style={styles.input} />
          {message ? <Text style={styles.error}>{message}</Text> : null}
          {hasAuthenticator ? <Pressable onPress={onUseAuthenticator}><Text style={styles.link}>Usar código de mi Authenticator</Text></Pressable> : null}
          <Pressable style={styles.primary} onPress={submit}><Text style={styles.primaryText}>Verificar</Text></Pressable>
          <Pressable style={styles.cancel} onPress={onCancel}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "center", backgroundColor: "rgba(28,25,23,.35)", padding: 20 },
  sheet: { backgroundColor: colors.white, borderRadius: 16, padding: 24, alignItems: "center" },
  icon: { color: colors.accent, fontSize: 30 },
  title: { color: colors.text, fontSize: 20, fontWeight: "800", marginVertical: 12 },
  input: { width: "100%", borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, textAlign: "center", fontFamily: "Courier New", fontSize: 22, letterSpacing: 8 },
  error: { color: colors.danger, textAlign: "center", marginTop: 10 },
  link: { color: colors.accent, marginTop: 14, fontWeight: "700" },
  primary: { marginTop: 18, width: "100%", backgroundColor: colors.accent, borderRadius: 8, padding: 14 },
  primaryText: { color: colors.white, textAlign: "center", fontWeight: "800" },
  cancel: { marginTop: 12, padding: 8 },
  cancelText: { color: colors.muted, fontWeight: "700" }
});
