function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderLoginPage(options: {
  state: string;
  redirectUri: string;
  challenge: string;
  clientId: string;
  method: string;
  message?: string;
}): string {
  const notice = options.message
    ? `<p class="notice">${escapeText(options.message)}</p>`
    : "";
  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Llave - Acceso seguro</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#FAFAF7;color:#17221B;font-family:Arial,sans-serif;min-height:100vh;display:grid;place-items:center}
.panel{width:min(390px,calc(100% - 32px));background:#fff;border:1px solid #E4E7E0;border-radius:14px;padding:34px;box-shadow:0 12px 32px rgba(22,101,52,.08)}
h1{margin:0 0 24px;color:#16A34A;font-size:28px}.field{margin:14px 0}.field label{display:block;margin-bottom:7px;font-size:14px;font-weight:700}.field input{width:100%;border:1px solid #CBD5C7;border-radius:8px;padding:12px;font-size:16px}.field input:focus{outline:2px solid #16A34A;border-color:#16A34A}button{width:100%;margin-top:12px;border:0;border-radius:8px;background:#16A34A;color:#fff;padding:13px;font-size:16px;font-weight:800}.notice{background:#F0FDF4;border-left:4px solid #16A34A;color:#166534;padding:10px;border-radius:6px;font-size:14px}
</style></head>
<body><form class="panel" method="POST" action="/oauth/authorize">
<input type="hidden" name="state" value="${escapeText(options.state)}">
<input type="hidden" name="response_type" value="code">
<input type="hidden" name="redirect_uri" value="${escapeText(options.redirectUri)}">
<input type="hidden" name="code_challenge" value="${escapeText(options.challenge)}">
<input type="hidden" name="code_challenge_method" value="${escapeText(options.method)}">
<input type="hidden" name="client_id" value="${escapeText(options.clientId)}">
<h1>Llave</h1>${notice}
<div class="field"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" value="test@unisabana.edu.co" autocomplete="email" required></div>
<div class="field"><label for="password">Contraseña</label><input id="password" name="password" type="password" value="test" autocomplete="current-password" required></div>
<button type="submit">Ingresar</button>
</form></body></html>`;
}
