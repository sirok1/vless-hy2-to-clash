import { Bot, InputFile } from "grammy";
import type { Context } from "grammy";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";

import { VlessLinkParser } from "../core/parser.js";
import { ClashConfigGenerator } from "../core/generator.js";
import { createLogger } from "./logger.js";

const logger = createLogger("TelegramBot");

class ClashBotApp {
  private bot: Bot<Context>;
  private parser: VlessLinkParser;
  private generator: ClashConfigGenerator;

  constructor() {
    const token = process.env.BOT_TOKEN;
    const apiRoot = process.env.TELEGRAM_BOT_API_URL;
    const proxyUrl = process.env.PROXY_URL;

    if (!token) {
      throw new Error("Переменная окружения BOT_TOKEN не задана.");
    }

    const clientConfig: {
      apiRoot?: string;
      baseFetchConfig?: { agent: HttpsProxyAgent<string> | SocksProxyAgent; compress: true };
    } = {};

    if (apiRoot) {
      clientConfig.apiRoot = apiRoot;
    }

    if (proxyUrl) {
      logger.info(`Использование прокси: ${proxyUrl}`);
      const agent = proxyUrl.startsWith("socks")
        ? new SocksProxyAgent(proxyUrl)
        : new HttpsProxyAgent(proxyUrl);
      clientConfig.baseFetchConfig = { agent, compress: true };
    }

    this.bot = new Bot<Context>(token, { client: clientConfig });
    this.parser = new VlessLinkParser();
    this.generator = new ClashConfigGenerator();

    this.bot.catch((err) => {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error("Ошибка в middleware бота.", error);
    });

    this.registerHandlers();
  }

  private registerHandlers(): void {
    this.bot.command("start", async (ctx) => {
      logger.info(`Пользователь ${ctx.from?.id} нажал /start`);
      await ctx.reply(
        "Привет! Пришли мне ссылку vless://, hy2:// или vpn://, и я соберу Clash-конфиг."
      );
    });

    this.bot.on("message:text", async (ctx) => {
      const text = (ctx.msg.text || "").trim();

      if (!text.includes("vless://") && !text.includes("hy2://") && !text.includes("hysteria2://") && !text.includes("vpn://")) {
        await ctx.reply(
          "Пожалуйста, отправь корректную ссылку, начинающуюся с vless://, hy2:// или vpn://"
        );
        return;
      }

      logger.info(`Получена ссылка от ${ctx.from.id}`);

      try {
        await ctx.reply("Обрабатываю ссылку...");
        const linkData = this.parser.parse(text);
        const clashConfig = this.generator.generate(linkData);
        logger.info(`Генерация завершена. Размер конфига: ${clashConfig.length} байт`);

        try {
          await ctx.replyWithDocument(
            new InputFile(Buffer.from(clashConfig, "utf8"), "clash-config.yaml"),
            {
              caption: "Готовый Clash-конфиг.",
            }
          );
          logger.info(`Конфигурация успешно отправлена пользователю ${ctx.from.id}`);
        } catch (docError) {
          const docErr = docError as Error;
          logger.error(`Ошибка при отправке документа: ${docErr.message}`);

          logger.info("Попытка отправить конфиг частями...");
          await ctx.reply("⚠️ Не удалось отправить файл из-за сетевой ошибки. Отправляю текст частями:");

          const chunkSize = 4000;
          for (let i = 0; i < clashConfig.length; i += chunkSize) {
            const chunk = clashConfig.substring(i, i + chunkSize);
            await ctx.reply(`\`\`\`yaml\n${chunk}\n\`\`\``, { parse_mode: "Markdown" });
          }
        }
      } catch (error) {
        const err = error as Error;
        logger.warn(`Ошибка обработки для ${ctx.from.id}: ${err.message}`);
        await ctx.reply(`Ошибка: ${err.message}`);
      }
    });
  }

  async start(): Promise<void> {
    logger.info("Запуск Telegram-бота...");

    this.bot.start({
      onStart: (info) => {
        logger.info(`Бот @${info.username} запущен`);
      },
    });

    const stop = (signal: string): void => {
      logger.info(`Получен сигнал ${signal}, остановка бота...`);
      this.bot.stop();
      process.exit(0);
    };

    process.once("SIGINT", () => stop("SIGINT"));
    process.once("SIGTERM", () => stop("SIGTERM"));
  }
}

export { ClashBotApp };
