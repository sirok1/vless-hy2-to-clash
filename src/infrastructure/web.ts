import { Hono } from "hono";
import { stream } from "hono/streaming";

import { VlessLinkParser } from "../core/parser.js";
import { ClashConfigGenerator } from "../core/generator.js";
import { createLogger } from "./logger.js";

const logger = createLogger("WebServer");

function renderPage(): string {
  return /*html*/ `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clash Config Generator</title>
  <style>
    :root {
      --bg-primary: #0a0a0f;
      --bg-card: rgba(255, 255, 255, 0.04);
      --bg-input: rgba(255, 255, 255, 0.06);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --border-focus: rgba(139, 92, 246, 0.5);
      --text-primary: #f0f0f5;
      --text-secondary: #8a8a9a;
      --accent: #8b5cf6;
      --accent-end: #6366f1;
      --error: #ef4444;
      --success: #22c55e;
      --radius: 16px;
      --radius-sm: 10px;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }

    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background:
        radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99, 102, 241, 0.15), transparent),
        radial-gradient(ellipse 60% 50% at 80% 100%, rgba(139, 92, 246, 0.1), transparent),
        radial-gradient(ellipse 50% 40% at 20% 80%, rgba(56, 189, 248, 0.06), transparent);
      pointer-events: none;
      z-index: 0;
    }

    .card {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 560px;
      margin: 20px;
      padding: clamp(24px, 5vw, 40px);
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius);
      backdrop-filter: blur(40px) saturate(1.2);
      -webkit-backdrop-filter: blur(40px) saturate(1.2);
      box-shadow:
        0 0 0 1px rgba(255, 255, 255, 0.03),
        0 20px 60px rgba(0, 0, 0, 0.4),
        0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .title {
      font-size: clamp(1.4rem, 4vw, 1.8rem);
      font-weight: 700;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #c4b5fd 0%, #818cf8 40%, #6366f1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 6px;
    }

    .subtitle {
      font-size: clamp(0.82rem, 2vw, 0.9rem);
      color: var(--text-secondary);
      margin-bottom: 28px;
      line-height: 1.5;
    }

    .input-group {
      margin-bottom: 20px;
    }

    .input-label {
      display: block;
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-secondary);
      margin-bottom: 8px;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    textarea {
      width: 100%;
      min-height: 120px;
      padding: 14px 16px;
      background: var(--bg-input);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', ui-monospace, monospace;
      font-size: 0.85rem;
      line-height: 1.6;
      resize: vertical;
      transition: border-color 0.2s, box-shadow 0.2s;
      outline: none;
    }

    textarea::placeholder {
      color: rgba(138, 138, 154, 0.5);
    }

    textarea:focus {
      border-color: var(--border-focus);
      box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12), 0 0 20px rgba(139, 92, 246, 0.06);
    }

    .btn {
      width: 100%;
      padding: 14px 24px;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.25s, opacity 0.2s;
      position: relative;
      overflow: hidden;
      letter-spacing: 0.01em;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--accent), var(--accent-end));
      color: #fff;
      box-shadow: 0 2px 12px rgba(99, 102, 241, 0.25);
    }

    @media (hover: hover) {
      .btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 24px rgba(99, 102, 241, 0.35), 0 0 40px rgba(139, 92, 246, 0.1);
      }
    }

    .btn-primary:active {
      transform: translateY(0) scale(0.985);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.06);
      color: var(--text-primary);
      border: 1px solid var(--border-subtle);
      margin-top: 10px;
    }

    @media (hover: hover) {
      .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.15);
      }
    }

    .spinner {
      display: inline-block;
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      vertical-align: middle;
      margin-right: 8px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .result {
      margin-top: 24px;
      display: none;
    }

    .result.visible {
      display: block;
      animation: fadeSlideIn 0.35s ease-out;
    }

    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .result-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .result-title {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--success);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .preview {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 16px;
      font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', ui-monospace, monospace;
      font-size: 0.78rem;
      line-height: 1.65;
      color: var(--text-secondary);
      max-height: 300px;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-all;
      -webkit-overflow-scrolling: touch;
    }

    .preview::-webkit-scrollbar {
      width: 6px;
    }

    .preview::-webkit-scrollbar-track {
      background: transparent;
    }

    .preview::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }

    .toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      padding: 12px 20px;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 500;
      z-index: 100;
      opacity: 0;
      transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s;
      max-width: calc(100vw - 40px);
      text-align: center;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }

    .toast.visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    .toast-error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: #fca5a5;
    }

    .protocols {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 24px;
    }

    .protocol-tag {
      font-size: 0.7rem;
      font-weight: 500;
      padding: 4px 10px;
      border-radius: 20px;
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.15);
      color: #a78bfa;
      letter-spacing: 0.02em;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1 class="title">Clash Config Generator</h1>
    <p class="subtitle">Вставь ссылку — получи готовый конфиг для Clash</p>

    <div class="protocols">
      <span class="protocol-tag">vless://</span>
      <span class="protocol-tag">hy2://</span>
      <span class="protocol-tag">hysteria2://</span>
      <span class="protocol-tag">trojan://</span>
      <span class="protocol-tag">vpn://</span>
    </div>

    <div class="input-group">
      <label class="input-label" for="link-input">Ссылка</label>
      <textarea id="link-input" placeholder="vless://...&#10;hy2://...&#10;trojan://...&#10;vpn://..."></textarea>
    </div>

    <button class="btn btn-primary" id="generate-btn" onclick="generate()">
      Сгенерировать
    </button>

    <div class="result" id="result">
      <div class="result-header">
        <span class="result-title">Конфиг сгенерирован</span>
      </div>
      <div class="preview" id="preview"></div>
      <button class="btn btn-secondary" onclick="download()">
        Скачать .yaml
      </button>
    </div>
  </div>

  <div class="toast toast-error" id="toast"></div>

  <script>
    let currentConfig = '';
    let currentName = 'clash-config.yaml';

    function showToast(message, duration = 3000) {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.classList.add('visible');
      setTimeout(() => toast.classList.remove('visible'), duration);
    }

    async function generate() {
      const input = document.getElementById('link-input').value.trim();
      const btn = document.getElementById('generate-btn');
      const result = document.getElementById('result');

      if (!input) {
        showToast('Вставь ссылку в поле выше');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span>Генерация...';
      result.classList.remove('visible');

      try {
        const resp = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ link: input }),
        });

        if (!resp.ok) {
          const data = await resp.json();
          throw new Error(data.error || 'Ошибка сервера');
        }

        const disposition = resp.headers.get('Content-Disposition') || '';
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match) currentName = match[1];

        currentConfig = await resp.text();
        document.getElementById('preview').textContent = currentConfig;
        result.classList.add('visible');
      } catch (e) {
        showToast(e.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = 'Сгенерировать';
      }
    }

    function download() {
      const blob = new Blob([currentConfig], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentName;
      a.click();
      URL.revokeObjectURL(url);
    }

    document.getElementById('link-input').addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        generate();
      }
    });
  </script>
</body>
</html>`;
}

class ClashWebApp {
  private parser: VlessLinkParser;
  private generator: ClashConfigGenerator;
  private app: Hono;

  constructor() {
    this.parser = new VlessLinkParser();
    this.generator = new ClashConfigGenerator();
    this.app = new Hono();

    this.app.get("/", (c) => {
      return c.html(renderPage());
    });

    this.app.post("/api/generate", async (c) => {
      const body = await c.req.json<{ link: string }>();

      if (!body.link || typeof body.link !== "string") {
        return c.json({ error: "Поле link обязательно." }, 400);
      }

      try {
        const linkData = this.parser.parse(body.link.trim());
        const clashConfig = this.generator.generate(linkData);
        logger.info(`Web: генерация завершена, ${clashConfig.length} байт, протокол: ${linkData.protocol}`);

        const proxyName = linkData.protocol === "vless"
          ? "VLESS-Reality"
          : (linkData as any).name || "proxy";

        const safeName = proxyName.replace(/[\\/:*?"<>|]/g, "_").trim(". ");
        const filename = `${safeName}.yaml`;

        c.header("Content-Type", "text/yaml; charset=utf-8");
        c.header("Content-Disposition", `attachment; filename="${encodeURIComponent(safeName)}.yaml"; filename*=UTF-8''${encodeURIComponent(`${safeName}.yaml`)}`);

        return stream(c, async (stream) => {
          await stream.write(clashConfig);
        });
      } catch (error) {
        const err = error as Error;
        logger.warn(`Web: ошибка обработки: ${err.message}`);
        return c.json({ error: err.message }, 400);
      }
    });
  }

  start(port: number): void {
    logger.info(`Веб-сервер запускается на порту ${port}...`);

    Bun.serve({
      port,
      fetch: this.app.fetch,
    });

    logger.info(`Веб-сервер доступен: http://localhost:${port}`);
  }
}

export { ClashWebApp };
