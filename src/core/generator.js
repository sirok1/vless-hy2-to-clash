const fs = require("node:fs");
const path = require("node:path");

const COMMON_DIRECT_RULES = [
  "DOMAIN-SUFFIX,yanima.space,DIRECT",
  "DOMAIN-SUFFIX,yanima.online,DIRECT",
  "DOMAIN-SUFFIX,yandex.ru,DIRECT",
  "DOMAIN-SUFFIX,yandex.net,DIRECT",
  "DOMAIN-SUFFIX,kinopoisk.ru,DIRECT",
  "DOMAIN-SUFFIX,geobasket.ru,DIRECT",
  "DOMAIN-SUFFIX,wbcontent.net,DIRECT",
  "DOMAIN-SUFFIX,wb.ru,DIRECT",
  "DOMAIN-SUFFIX,wbbasket.ru,DIRECT",
  "DOMAIN-SUFFIX,wildberries.ru,DIRECT",
  "DOMAIN-SUFFIX,ivi.ru,DIRECT",
  "DOMAIN-SUFFIX,tvoe.live,DIRECT",
  "DOMAIN-SUFFIX,amediateka.ru,DIRECT",
  "DOMAIN-SUFFIX,kinoflex.ru,DIRECT",
  "DOMAIN-SUFFIX,vk.com,DIRECT",
  "DOMAIN-SUFFIX,mail.ru,DIRECT",
  "DOMAIN-SUFFIX,datacloudmail.ru,DIRECT",
  "DOMAIN-SUFFIX,ozon.ru,DIRECT",
  "DOMAIN-SUFFIX,dns-shop.ru,DIRECT",
  "DOMAIN-SUFFIX,tome.ge,DIRECT",
  "DOMAIN-SUFFIX,remanga.org,DIRECT",
  "DOMAIN-SUFFIX,hentaicdn.org,DIRECT",
  "DOMAIN-SUFFIX,2ip.ru,DIRECT",
];

const COMMON_PROCESS_RULES = [
  "PROCESS-NAME,bittorrent.exe,DIRECT",
  "PROCESS-NAME,uTorrent.exe,DIRECT",
  "PROCESS-NAME,utorrent.exe,DIRECT",
  "PROCESS-NAME,uTorrentWeb.exe,DIRECT",
  "PROCESS-NAME,qBittorrent.exe,DIRECT",
  "PROCESS-NAME,qbittorrent.exe,DIRECT",
  "PROCESS-NAME,transmission.exe,DIRECT",
  "PROCESS-NAME,transmission-qt.exe,DIRECT",
  "PROCESS-NAME,transmission-daemon.exe,DIRECT",
  "PROCESS-NAME,deluge.exe,DIRECT",
  "PROCESS-NAME,BitComet.exe,DIRECT",
  "PROCESS-NAME,Tixati.exe,DIRECT",
  "PROCESS-NAME,BiglyBT.exe,DIRECT",
  "PROCESS-NAME,Vuze.exe,DIRECT",
  "PROCESS-NAME,FreeDownloadManager.exe,DIRECT",
  "PROCESS-NAME,PicoTorrent.exe,DIRECT",
  "PROCESS-NAME,Tribler.exe,DIRECT",
  "PROCESS-NAME,FrostWire.exe,DIRECT",
  "PROCESS-NAME,BitSpirit.exe,DIRECT",
  "PROCESS-NAME,Thunder.exe,DIRECT",
  "PROCESS-NAME,steam.exe,DIRECT",
  "PROCESS-NAME,steamwebhelper.exe,DIRECT",
];

class ClashConfigGenerator {
  constructor() {
    this.whitelistRules = this.loadWhitelistRules();
  }

  generate(data) {
    const proxyName = this.getProxyName(data);
    const lines = [
      ...this.renderMainBlock(data),
      "proxies:",
      ...this.renderProxyBlock(data),
      "",
      "proxy-groups:",
      '  - name: "Proxy-Select"',
      "    type: select",
      "    proxies:",
      `      - "${proxyName}"`,
      "      - DIRECT",
      "",
      "rules:",
      "  # Эти сайты будут открываться напрямую (личный набор правил)",
      ...COMMON_DIRECT_RULES.map((rule) => `  - ${rule}`),
      "",
      "  # Битторрент и связанные процессы идут напрямую",
      ...COMMON_PROCESS_RULES.map((rule) => `  - ${rule}`),
      "",
    ];

    if (this.whitelistRules.length > 0) {
      lines.push("  # Whitelist domains");
      lines.push(...this.whitelistRules.map((rule) => `  - ${rule}`));
      lines.push("");
    }

    lines.push("  # Всё остальное через прокси");
    lines.push("  - MATCH,Proxy-Select");

    return `${lines.join("\n")}\n`;
  }

  getProxyName(data) {
    if (data.protocol === "hysteria2") {
      return "Hysteria2-SingBox";
    }

    return "VLESS-Reality";
  }

  renderMainBlock(data) {
    if (data.protocol === "hysteria2") return [""];
    else
      return [
        "# Основные настройки влесс",
        "port: 7890",
        "socks-port: 7891",
        "allow-lan: true",
        "mode: rule",
        "log-level: info",
        "ipv6: false",
        "",
      ];
  }

  renderProxyBlock(data) {
    if (data.protocol === "hysteria2") {
      return this.renderHysteria2Proxy(data);
    }

    return this.renderVlessProxy(data);
  }

  renderVlessProxy(data) {
    return [
      '  - name: "VLESS-Reality"',
      "    type: vless",
      `    server: ${data.server}`,
      `    port: ${data.port}`,
      `    uuid: "${data.uuid}"`,
      `    network: ${data.network}`,
      "    tls: true",
      "    udp: true",
      `    flow: "${data.flow}"`,
      `    servername: ${data.sni}`,
      `    client-fingerprint: ${data.clientFingerprint}`,
      "    reality-opts:",
      `      public-key: "${data.publicKey}"`,
      `      short-id: "${data.shortId}"`,
    ];
  }

  renderHysteria2Proxy(data) {
    const lines = [
      '  - name: "Hysteria2-SingBox"',
      "    type: hysteria2",
      `    server: ${data.server}`,
      `    port: ${data.port}`,
      `    password: "${data.password}"`,
    ];

    if (data.sni) {
      lines.push(`    sni: ${data.sni}`);
    }

    lines.push(
      `    skip-cert-verify: ${data.skipCertVerify ? "true" : "false"}`,
    );

    if (data.obfs) {
      lines.push(`    obfs: ${data.obfs}`);
    }

    if (data.obfsPassword) {
      lines.push(`    obfs-password: "${data.obfsPassword}"`);
    }

    lines.push("    alpn:");

    for (const item of data.alpn || ["h3"]) {
      lines.push(`      - ${item}`);
    }

    return lines;
  }

  loadWhitelistRules() {
    const rulesPath = path.resolve(__dirname, "../../utils/clash_rules.txt");

    try {
      return fs
        .readFileSync(rulesPath, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    } catch (error) {
      return [];
    }
  }
}

module.exports = {
  ClashConfigGenerator,
};
