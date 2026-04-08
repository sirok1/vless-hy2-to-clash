const path = require("node:path");
const dotenv = require("dotenv");
const { Telegraf } = require("telegraf");

const { VlessLinkParser } = require("../core/parser");
const { ClashConfigGenerator } = require("../core/generator");
const { createLogger } = require("./logger");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const logger = createLogger("TelegramBot");

class ClashBotApp {
  constructor() {
    const token = process.env.BOT_TOKEN;

    if (!token) {
      throw new Error("Переменная окружения BOT_TOKEN не задана.");
    }

    this.bot = new Telegraf(token);
    this.parser = new VlessLinkParser();
    this.generator = new ClashConfigGenerator();

    this.registerHandlers();
  }

  registerHandlers() {
    this.bot.start(async (ctx) => {
      logger.info(`Пользователь ${ctx.from.id} нажал /start`);
      await ctx.reply(
        "Привет! Пришли мне VLESS-ссылку, и я создам для тебя Clash-конфигурацию."
      );
    });

    this.bot.on("text", async (ctx) => {
      const text = (ctx.message.text || "").trim();

      if (!text.includes("vless://")) {
        await ctx.reply(
          "Пожалуйста, отправь корректную ссылку, начинающуюся с vless://"
        );
        return;
      }

      logger.info(`Получена ссылка от ${ctx.from.id}`);

      try {
        const vlessData = this.parser.parse(text);
        const clashConfig = this.generator.generate(vlessData);
        const configFile = {
          source: Buffer.from(clashConfig, "utf8"),
          filename: "clash-config.yaml"
        };

        await ctx.replyWithDocument(configFile, {
          caption: "Готовый Clash-конфиг."
        });
        logger.info(`Конфигурация успешно отправлена пользователю ${ctx.from.id}`);
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
