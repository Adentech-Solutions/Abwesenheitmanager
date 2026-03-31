import { NextResponse } from 'next/server';

export function createBrandedHtmlResponse(
  type: 'success' | 'warning' | 'error',
  icon: string,
  title: string,
  message: string,
  dashboardUrl: string,
  statusCode: number = 200
): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>freyetag</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #F9FAFB;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      padding: 48px 40px;
      max-width: 480px;
      width: 100%;
      text-align: center;
    }
    .wordmark {
      font-size: 20px;
      font-weight: 500;
      letter-spacing: -0.5px;
      margin-bottom: 32px;
    }
    .wordmark-freye { color: #111827; }
    .wordmark-tag { color: #2563EB; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { color: #111827; font-size: 22px; font-weight: 700; margin-bottom: 8px; }
    p { color: #4B5563; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
    .btn {
      display: inline-block;
      background: #2563EB;
      color: white;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      transition: background 0.15s;
    }
    .btn:hover { background: #1D4ED8; }
    .btn-ghost {
      background: none;
      color: #2563EB;
      padding: 8px 16px;
      text-decoration: none;
      cursor: pointer;
      border: none;
      font-size: 12px;
    }
    .success h1 { color: #059669; }
    .warning h1 { color: #D97706; }
    .error h1 { color: #DC2626; }
    .meta {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #E5E7EB;
      color: #9CA3AF;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="wordmark">
      <span class="wordmark-freye">freye</span><span class="wordmark-tag">tag</span>
    </div>
    <div class="${type}">
      <div class="icon">${icon}</div>
      <h1>${title}</h1>
      <p>${message}</p>
    </div>
    <a href="${dashboardUrl}" class="btn">Zum Dashboard</a>
    <div class="meta">
      <button class="btn-ghost" onclick="window.close()">Fenster schließen</button>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: statusCode,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
