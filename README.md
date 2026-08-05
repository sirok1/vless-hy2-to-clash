# clash-config-generator

Telegram-бот и веб-интерфейс для конвертации VPN-ссылок в Clash-конфиг.

## Поддерживаемые протоколы

| Протокол | Формат ссылки | Версия Clash |
|----------|---------------|-------------|
| VLESS + Reality | `vless://...` | Clash (mihomo) |
| Hysteria2 | `hy2://` / `hysteria2://` | Clash Meta (mihomo) |
| Trojan | `trojan://...` | Clash Meta (mihomo) |
| AmneziaWG 1.x | `vpn://` (AmneziaVPN text key) | Clash Meta (mihomo) |
| AmneziaWG 2.0 | `vpn://` (AmneziaVPN text key) | Clash Meta (mihomo) |

## Возможности

- Парсинг ссылок vless://, hy2://, hysteria2://, trojan://, vpn://
- Генерация готового YAML-конфига для Clash/Clash Verge/mihomo
- DNS-блок с fake-ip для Hysteria2 и AmneziaWG
- AmneziaWG: автоматическое определение версии (1.x / 2.0) по `protocol_version`
- AmneziaWG: извлечение ключей из `last_config` внутри vpn:// payload
- Hysteria2: поддержка obfs (salamander), ALPN, SNI, client-fingerprint
- Trojan: поддержка password, SNI, gRPC, Reality-параметров и client-fingerprint
- Whitelist российских доменов + торрент-клиенты → DIRECT
- Telegram-бот (grammY) и веб-интерфейс (Hono) запускаются вместе
- Адаптивный UI: dark theme, glassmorphism, mobile-first
- Прокси-поддержка (HTTP/SOCKS5) для Telegram-бота

## Стек

- **Runtime**: Bun
- **Language**: TypeScript (strict)
- **Bot**: grammY
- **Web**: Hono + встроенный HTML/CSS/JS
- **Proxy**: https-proxy-agent, socks-proxy-agent

## Установка

```bash
bun install
```

## Настройка

Скопируй `.env.example` в `.env` и заполни:

```env
BOT_TOKEN=           # Токен Telegram-бота (обязательно для бота)
TELEGRAM_BOT_API_URL=  # Кастомный API URL (опционально)
PROXY_URL=           # HTTP/SOCKS5 прокси для бота (опционально)
WEB_PORT=3000        # Порт веб-интерфейса
```

> Bun автоматически подхватывает `.env` — dotenv не нужен.

## Запуск

```bash
bun start
```

Запускает веб-сервер и Telegram-бот одновременно.

Веб-интерфейс: `http://localhost:3000`

## Проверка типов

```bash
bun run check
```

## Структура проекта

```
src/
  index.ts                 # Точка входа (бот + веб)
  core/
    parser.ts              # Парсер ссылок (vless, hy2, vpn)
    generator.ts           # Генератор Clash YAML
  infrastructure/
    bot.ts                 # Telegram-бот (grammY)
    web.ts                 # Веб-сервер (Hono) + HTML
    logger.ts              # Логгер
utils/
  txt-to-rules.ts          # Конвертер whitelist.txt → clash_rules.txt
  whitelist.txt            # Список доменов для DIRECT
  clash_rules.txt          # Сгенерированные правила
```

## Что изменилось

Оригинальный проект на Python от [@ilya1708](https://github.com/ilya1708)

- Переписан на Bun + TypeScript
- Добавлена поддержка Hysteria2 (alpn, obfs, fm/salamander, client-fingerprint)
- Добавлена поддержка AmneziaWG (vpn://) — v1.x и v2.0
- Добавлен веб-интерфейс с адаптивным UI
- Бот переведён с Telegraf на grammY
- Убран dotenv (Bun подхватывает .env автоматически)
- CJS → ESM
- Добавлен DNS-блок (fake-ip) для Hysteria2 и AmneziaWG конфигов
- Расширен whitelist российских доменов

## API

### POST /api/generate

```json
{ "link": "vless://..." }
```

Возвращает YAML-файл с `Content-Disposition: attachment`.

## Лицензия

См. [LICENSE](LICENSE)
