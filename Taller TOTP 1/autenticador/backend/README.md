# Backend Auth

Backend Express 5 + TypeScript para OAuth/PKCE, TOTP, JWT, refresh rotativo y bóveda protegida.

## Requisitos

- Node.js 24 o superior
- npm

## Ejecutar

Desde este directorio:

```powershell
copy .env.example .env
npm install
npm run dev
```

El servidor escucha en `0.0.0.0:4100` y usa variables de `.env`.

## Credenciales y QR

- Correo demo: `test@unisabana.edu.co`
- Contraseña demo: `test`
- Secret TOTP demo: `JBSWY3DPEHPK3PXP`
- QR local: `http://localhost:4100/dev/qr`
- Desde el teléfono conectado al mismo Wi-Fi: `http://192.168.1.3:4100/dev/qr`.
- La IPv4 puede cambiar al cambiar de red. Consulta `ipconfig`, toma la IPv4 del adaptador Wi-Fi y actualiza `app/.env`.

## Scripts

```powershell
npm run dev
npm run build
npm start
npm test
npm run smoke
```

Para el smoke test, inicia primero el servidor con `npm run dev`.
