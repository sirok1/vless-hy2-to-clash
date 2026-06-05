import { ClashBotApp } from "./infrastructure/bot.js";
import { ClashWebApp } from "./infrastructure/web.js";
import { createLogger } from "./infrastructure/logger.js";

const logger = createLogger("Main");

async function main(): Promise<void> {
  try {
    const webPort = Number(process.env.WEB_PORT) || 3000;
    const webApp = new ClashWebApp();
    webApp.start(webPort);
  } catch (error) {
    logger.error("Критический сбой при запуске веб-сервера.", error as Error);
    process.exit(1);
  }

  try {
    const botApp = new ClashBotApp();
    await botApp.start();
  } catch (error) {
    logger.error("Критический сбой при запуске Telegram-бота.", error as Error);
    process.exit(1);
  }
}

void main();
