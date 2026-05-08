const path = require("node:path");
const dotenv = require("dotenv");
const { Telegraf, Input } = require("telegraf");
const { HttpsProxyAgent } = require("https-proxy-agent");
const { SocksProxyAgent } = require("socks-proxy-agent");

const { VlessLinkParser } = require("../core/parser");
const { ClashConfigGenerator } = require("../core/generator");
const { createLogger } = require("./logger");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const logger = createLogger("TelegramBot");

class ClashBotApp {
  constructor() {
    const token = process.env.BOT_TOKEN;
    const apiRoot = process.env.TELEGRAM_BOT_API_URL;
    const proxyUrl = process.env.PROXY_URL;

    if (!token) {
      throw new Error("Переменная окружения BOT_TOKEN не задана.");
    }

    const options = {
      telegram: {
        apiTimeout: 120000
      }
    };

    if (apiRoot) {
      options.telegram.apiRoot = apiRoot;
    }

    if (proxyUrl) {
      logger.info(`Использование прокси: ${proxyUrl}`);
      const agent = proxyUrl.startsWith("socks")
        ? new SocksProxyAgent(proxyUrl)
        : new HttpsProxyAgent(proxyUrl);
      options.telegram.agent = agent;
    }

    this.bot = new Telegraf(token, options);
    this.parser = new VlessLinkParser();
    this.generator = new ClashConfigGenerator();

    this.registerHandlers();
  }

  registerHandlers() {
    this.bot.start(async (ctx) => {
      logger.info(`Пользователь ${ctx.from.id} нажал /start`);
      await ctx.reply(
        "Привет! Пришли мне ссылку vless:// или hy2://, и я соберу Clash-конфиг."
      );
    });

    this.bot.on("text", async (ctx) => {
      const text = (ctx.message.text || "").trim();

      if (!text.includes("vless://") && !text.includes("hy2://") && !text.includes("hysteria2://")) {
        await ctx.reply(
          "Пожалуйста, отправь корректную ссылку, начинающуюся с vless:// или hy2://"
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
            Input.fromBuffer(Buffer.from(clashConfig, "utf8"), "clash-config.yaml"),
            {
              caption: "Готовый Clash-конфиг."
            }
          );
          logger.info(`Конфигурация успешно отправлена пользователю ${ctx.from.id}`);
        } catch (docError) {
          logger.error(`Ошибка при отправке документа: ${docError.message}`);
          
          logger.info("Попытка отправить конфиг текстом...");
          await ctx.reply("Не удалось отправить файл, вот конфиг текстом (может быть обрезан):");
          
          // Режем конфиг, если он больше лимита Telegram (4096)
          const textConfig = clashConfig.length > 4000 
            ? clashConfig.substring(0, 3900) + "\n... [обрезано]" 
            : clashConfig;
            
          await ctx.reply(`\`\`\`yaml\n${textConfig}\n\`\`\``, { parse_mode: "Markdown" });
        }
      } catch (error) {
        logger.warn(`Ошибка обработки для ${ctx.from.id}: ${error.message}`);
        await ctx.reply(`Ошибка: ${error.message}`);
      }
    });
  }

  async start() {
    logger.info("Запуск Telegram-бота...");
    await this.bot.launch();

    const stop = async (signal) => {
      logger.info(`Получен сигнал ${signal}, остановка бота...`);
      await this.bot.stop(signal);
      process.exit(0);
    };

    process.once("SIGINT", () => {
      void stop("SIGINT");
    });
    process.once("SIGTERM", () => {
      void stop("SIGTERM");
    });
  }
}

module.exports = {
  ClashBotApp
};
