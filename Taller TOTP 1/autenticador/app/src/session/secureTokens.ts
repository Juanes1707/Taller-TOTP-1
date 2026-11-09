import * as SecureStore from "expo-secure-store";

export const KEYS = {
  refresh: "llave.refresh_token",
  otpSecret: "llave.otp_secret",
  qrAccount: "llave.qr_account"
};

export const readRefresh = () => SecureStore.getItemAsync(KEYS.refresh);
export const saveRefresh = (value: string) => SecureStore.setItemAsync(KEYS.refresh, value);
export const clearRefresh = () => SecureStore.deleteItemAsync(KEYS.refresh);
export const readOtpSecret = () => SecureStore.getItemAsync(KEYS.otpSecret);
export const saveOtpSecret = (value: string) => SecureStore.setItemAsync(KEYS.otpSecret, value);
export const clearOtpSecret = () => SecureStore.deleteItemAsync(KEYS.otpSecret);
export const readQrAccount = () => SecureStore.getItemAsync(KEYS.qrAccount);
export const saveQrAccount = (value: string) => SecureStore.setItemAsync(KEYS.qrAccount, value);
export const clearQrAccount = () => SecureStore.deleteItemAsync(KEYS.qrAccount);
