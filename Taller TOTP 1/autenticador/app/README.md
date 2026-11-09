# Llave

Aplicación móvil Expo/React Native para autenticación OAuth con PKCE, TOTP y acceso elevado.

## Requisitos

- Node.js y npm
- Expo Go
- Backend Llave ejecutándose en el puerto 4100

## Ejecutar

```powershell
cd autenticador/backend
npm run dev
```

```powershell
cd autenticador/app
npm install
npx expo start
```

Configura `EXPO_PUBLIC_API_URL=http://192.168.1.3:4100` en `.env`. Esa es la IPv4 Wi-Fi actual de este equipo; si cambias de red, ejecuta `ipconfig`, toma la IPv4 del adaptador Wi-Fi y reemplázala antes de iniciar Expo.

## Organización

- `src/app`: navegación stack y pantallas
- `src/redux`: sesión y MFA
- `src/http/apiFetch.ts`: fetch y renovación clásica de refresh
- `src/otp`: Base32, HMAC-SHA1, TOTP y hook visual
- `src/oauth`: PKCE y flujo OAuth
- `src/session/secureTokens.ts`: claves SecureStore con prefijo `llave.`
- `src/ui/colors.ts`: identidad visual

## Pruebas

```powershell
npx tsc --noEmit
npm test
```
