import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { parseOtpauth } from "../otp/totp";
import { saveOtpSecret, saveQrAccount } from "../session/secureTokens";
import { colors } from "../ui/colors";

export default function Scan() {
  const [permission, requestPermission] = useCameraPermissions();
  useEffect(() => {
    if (!permission?.granted) void requestPermission();
  }, [permission, requestPermission]);
  const onBarcode = ({ data }: { data: string }) => {
    const parsed = parseOtpauth(data);
    if (!parsed) return;
    void saveOtpSecret(parsed.secret).then(async () => {
      await saveQrAccount(parsed.account);
      router.replace("/authenticator" as never);
    });
  };
  return (
    <View style={styles.container}>
      {permission?.granted ? <CameraView style={styles.camera} barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={onBarcode} /> :
        <Text style={styles.permission}>Se necesita permiso de cámara para escanear el QR.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.text }, camera: { flex: 1 },
  permission: { color: colors.white, textAlign: "center", margin: 20 }
});
