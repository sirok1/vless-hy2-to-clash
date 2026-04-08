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

    if (parsedUrl.protocol === "vless:") {
      return this.parseVless(parsedUrl);
    }

    if (parsedUrl.protocol === "hy2:" || parsedUrl.protocol === "hysteria2:") {
      return this.parseHysteria2(parsedUrl);
    }

    throw new Error("Поддерживаются только ссылки vless:// и hy2://");
  }

  parseVless(parsedUrl) {
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
      protocol: "vless",
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

  parseHysteria2(parsedUrl) {
    const username = decodeURIComponent(parsedUrl.username || "");
    const secret = decodeURIComponent(parsedUrl.password || "");
    const server = parsedUrl.hostname;
    const port = Number(parsedUrl.port);

    if (!secret && !username) {
      throw new Error("Пароль Hysteria2 не найден в ссылке.");
    }

    if (!server || Number.isNaN(port) || port <= 0) {
      throw new Error("Сервер или порт не найдены.");
    }

    return {
      protocol: "hysteria2",
      server,
      port,
      password: username ? `${username}:${secret}` : secret,
      sni: parsedUrl.searchParams.get("sni") || "",
      skipCertVerify: this.parseBooleanParam(parsedUrl.searchParams.get("insecure")),
      obfs: parsedUrl.searchParams.get("obfs") || "",
      obfsPassword: parsedUrl.searchParams.get("obfs-password") || "",
      pinSha256: parsedUrl.searchParams.get("pinSHA256") || "",
      name: "Hysteria2-SingBox",
      alpn: ["h3"]
    };
  }

  parseBooleanParam(value) {
    return value === "1" || value === "true";
  }
}

module.exports = {
  VlessLinkParser
};
