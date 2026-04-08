const { URL } = require("node:url");

class VlessLinkParser {
  parse(link) {
    if (typeof link !== "string" || link.trim().length === 0) {
      throw new Error("Ссылка пуста.");
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(link.trim());
    } catch (error) {
      throw new Error("Некорректный формат ссылки.");
    }

    if (parsedUrl.protocol !== "vless:") {
      throw new Error("Поддерживаются только ссылки vless://");
    }

    const uuid = decodeURIComponent(parsedUrl.username || "");
    const server = parsedUrl.hostname;
    const port = Number(parsedUrl.port);

    if (!uuid) {
      throw new Error("UUID не найден в ссылке.");
    }

    if (!server || Number.isNaN(port) || port <= 0) {
      throw new Error("Сервер или порт не найдены.");
    }

    return {
      uuid,
      server,
      port,
      flow: parsedUrl.searchParams.get("flow") || "",
      sni: parsedUrl.searchParams.get("sni") || "",
      publicKey: parsedUrl.searchParams.get("pbk") || "",
      shortId: parsedUrl.searchParams.get("sid") || "",
      clientFingerprint: parsedUrl.searchParams.get("fp") || "chrome",
      network: parsedUrl.searchParams.get("type") || "tcp",
      security: parsedUrl.searchParams.get("security") || "reality"
    };
  }
}

module.exports = {
  VlessLinkParser
};
