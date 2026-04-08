const { ClashBotApp } = require("./infrastructure/bot");
const { createLogger } = require("./infrastructure/logger");

const logger = createLogger("Main");

async function main() {
  try {
    const app = new ClashBotApp();
    await app.start();
  } catch (error) {
    logger.error("Критический сбой при запуске приложения.", error);
    process.exit(1);
  }
}

void main();
