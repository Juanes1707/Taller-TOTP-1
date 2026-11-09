# Llave - autenticador TOTP con OAuth PKCE

Proyecto de laboratorio móvil que implementa OAuth 2.0 con PKCE, tokens con renovación silenciosa, un autenticador TOTP calculado localmente y Step-Up 2FA para una bóveda protegida.

## Requisitos

- Node.js 24 o superior y npm.
- Un teléfono con **Expo Go** o un emulador Android/iOS.
- Teléfono y computador en la misma red Wi-Fi para probar con Expo Go.

## Configuración de red

La IPv4 Wi-Fi detectada en este equipo es `192.168.1.3`. Ya quedó configurada en `app/.env`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.3:4100
EXPO_PUBLIC_USE_EXPO_GO=true
```

Si te conectas a otra red, ejecuta `ipconfig`, localiza **Adaptador de LAN inalámbrica Wi-Fi > Dirección IPv4** y reemplaza esa IP. No uses las direcciones de VMware, Tailscale, WireGuard ni `localhost` en el teléfono.

## Iniciar el backend

Abre una terminal y deja este proceso ejecutándose:

```powershell
cd backend
npm install
npm run dev
```

Comprueba que aparece `Llave backend listening at http://0.0.0.0:4100`. La página para registrar la cuenta TOTP es:

```text
http://192.168.1.3:4100/dev/qr
```

Ábrela desde el navegador del computador y escanea el QR con la aplicación Llave y, si quieres demostrar paridad, también con Google Authenticator. Ambas muestran el mismo código de 6 dígitos. Credenciales del proveedor de demostración: `test@unisabana.edu.co` / `test`.

## Iniciar la aplicación móvil

En una segunda terminal:

```powershell
cd app
npm install
npx expo start
```

Escanea el QR que muestra Expo con Expo Go. Si Expo pregunta cómo conectarse, usa **LAN** y acepta el permiso de red de Windows si aparece. Pulsa **Probar conexión** en la pantalla inicial; debe indicar "Conexión disponible".

> En Expo Go, el retorno de OAuth usa automáticamente una URL `exp://...`; no cambies esa URL por `unisabana-auth://...`. El esquema `unisabana-auth` se usa automáticamente al ejecutar una development build o una versión instalada de la aplicación. Antes de compilar una APK, cambia `EXPO_PUBLIC_USE_EXPO_GO` a `false`.

## Recorrido para la sustentación

1. Visita `/dev/qr` y registra el QR tanto en Llave como en Google Authenticator.
2. En Llave, pulsa **Iniciar sesión**. Usa el navegador seguro con `test@unisabana.edu.co` / `test` y regresa por el deep link.
3. Abre **Authenticator**: el código se calcula localmente cada 30 segundos y sigue funcionando en modo avión.
4. Abre **Bóveda**, pulsa **Desbloquear** y usa el código de Llave/Google Authenticator. El backend emite un token elevado de 10 minutos.
5. En las herramientas de demostración de la bóveda, usa **Reenviar último código** para observar el rechazo anti-replay (409).

## Verificación técnica

Con el backend en ejecución, ejecuta:

```powershell
cd backend
npm test
npm run build
npm run smoke
```

Y para la aplicación:

```powershell
cd app
npx expo lint
npx tsc --noEmit
npm test
```

El `refresh_token` se guarda únicamente en Expo SecureStore; el `access_token` vive en memoria. El backend conserva datos de demostración en memoria, por lo que reiniciarlo invalida sesiones y códigos de autorización pendientes.
