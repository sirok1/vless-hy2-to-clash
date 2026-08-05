import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ParsedData } from "./parser.js";

const COMMON_DIRECT_RULES: string[] = [
  "DOMAIN-SUFFIX,r1-s3.yanima.space,DIRECT",
  "DOMAIN-SUFFIX,r2-s3.yanima.space,DIRECT",
  "DOMAIN-SUFFIX,r3-s3.yanima.space,DIRECT",
  "DOMAIN-SUFFIX,s3.yanima.space,DIRECT",
  "DOMAIN-SUFFIX,remanga.org,DIRECT",
  "DOMAIN-SUFFIX,hentaicdn.org,DIRECT",
  "DOMAIN-SUFFIX,redheadsound.studio,DIRECT",
  "DOMAIN-SUFFIX,kinescopecdn.net,DIRECT",
  "DOMAIN-SUFFIX,animelib.org,DIRECT",
  "DOMAIN-SUFFIX,hentaicdn.org,DIRECT",
  "DOMAIN-SUFFIX,2ip.ru,DIRECT",
];

const COMMON_PROCESS_RULES: string[] = [
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

const DNS_BLOCK: string[] = [
  "mixed-port: 7890",
  "allow-lan: false",
  "mode: rule",
  "log-level: info",
  "ipv6: false",
  "external-controller: 127.0.0.1:9090",
  "",
  "dns:",
  "  enable: true",
  "  ipv6: false",
  "  listen: 0.0.0.0:53",
  "  default-nameserver:",
  "    - 8.8.8.8",
  "    - 1.1.1.1",
  "  nameserver:",
  "    - https://dns.google/dns-query",
  "    - https://cloudflare-dns.com/dns-query",
  "  fallback:",
  "    - https://dns.google/dns-query",
  "  enhanced-mode: fake-ip",
  "  fake-ip-range: 198.18.0.1/16",
  "  fake-ip-filter:",
  '    - "*.lan"',
  "    - localhost.ptlogin2.qq.com",
  "",
];

class ClashConfigGenerator {
  private whitelistRules: string[];

  constructor() {
    this.whitelistRules = this.loadWhitelistRules();
  }

  generate(data: ParsedData): string {
    const proxyName = this.getProxyName(data);
    const lines: string[] = [
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

  private getProxyName(data: ParsedData): string {
    if (data.protocol === "hysteria2") {
      return data.name;
    }
    if (data.protocol === "trojan") {
      return data.name;
    }
    if (data.protocol === "awg" || data.protocol === "awg2") {
      return data.name;
    }
    return "VLESS-Reality";
  }

  private renderMainBlock(data: ParsedData): string[] {
    if (data.protocol === "hysteria2" || data.protocol === "awg" || data.protocol === "awg2") {
      return DNS_BLOCK;
    }

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

  private renderProxyBlock(data: ParsedData): string[] {
    if (data.protocol === "hysteria2") {
      return this.renderHysteria2Proxy(data);
    }
    if (data.protocol === "trojan") {
      return this.renderTrojanProxy(data);
    }
    if (data.protocol === "awg") {
      return this.renderAwgProxy(data);
    }
    if (data.protocol === "awg2") {
      return this.renderAwg2Proxy(data);
    }
    return this.renderVlessProxy(data);
  }

  private renderVlessProxy(data: Extract<ParsedData, { protocol: "vless" }>): string[] {
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

  private renderHysteria2Proxy(data: Extract<ParsedData, { protocol: "hysteria2" }>): string[] {
    const lines: string[] = [
      `  - name: "${data.name}"`,
      "    type: hysteria2",
      `    server: ${data.server}`,
      `    port: ${data.port}`,
      `    password: ${data.password}`,
    ];

    lines.push("    alpn:");

    for (const item of data.alpn) {
      lines.push(`      - ${item}`);
    }

    lines.push(`    sni: ${data.sni}`);
    lines.push(`    skip-cert-verify: ${data.skipCertVerify ? "true" : "false"}`);

    if (data.obfs) {
      lines.push(`    obfs: ${data.obfs}`);
    }

    if (data.obfsPassword) {
      lines.push(`    obfs-password: ${data.obfsPassword}`);
    }

    lines.push(`    client-fingerprint: ${data.clientFingerprint}`);

    return lines;
  }

  private renderTrojanProxy(data: Extract<ParsedData, { protocol: "trojan" }>): string[] {
    const lines: string[] = [
      `  - name: "${data.name}"`,
      "    type: trojan",
      `    server: ${data.server}`,
      `    port: ${data.port}`,
      `    password: "${data.password}"`,
      "    udp: true",
      `    sni: "${data.sni}"`,
      `    skip-cert-verify: ${data.skipCertVerify ? "true" : "false"}`,
      `    client-fingerprint: "${data.clientFingerprint}"`,
    ];

    if (data.network && data.network !== "tcp") {
      lines.push(`    network: ${data.network}`);
    }

    if (data.network === "grpc" && data.grpcServiceName) {
      lines.push("    grpc-opts:");
      lines.push(`      grpc-service-name: "${data.grpcServiceName}"`);
    }

    if (data.security === "reality" && (data.publicKey || data.shortId || data.spiderX)) {
      lines.push("    reality-opts:");
      if (data.publicKey) {
        lines.push(`      public-key: "${data.publicKey}"`);
      }
      if (data.shortId) {
        lines.push(`      short-id: "${data.shortId}"`);
      }
      if (data.spiderX) {
        lines.push(`      spider-x: "${data.spiderX}"`);
      }
    }

    return lines;
  }

  private renderAwgProxy(data: Extract<ParsedData, { protocol: "awg" }>): string[] {
    const lines: string[] = [
      `  - name: "${data.name}"`,
      "    type: wireguard",
      `    server: ${data.server}`,
      `    port: ${data.port}`,
      `    ip: ${data.ip}`,
      `    private-key: ${data.privateKey}`,
      `    public-key: ${data.publicKey}`,
    ];

    if (data.ipv6) {
      lines.push(`    ipv6: ${data.ipv6}`);
    }

    if (data.preSharedKey) {
      lines.push(`    pre-shared-key: ${data.preSharedKey}`);
    }

    lines.push("    udp: true");

    if (data.reserved.length > 0) {
      lines.push(`    reserved: [${data.reserved.join(", ")}]`);
    }

    if (data.mtu) {
      lines.push(`    mtu: ${data.mtu}`);
    }

    if (data.persistentKeepalive) {
      lines.push(`    persistent-keepalive: ${data.persistentKeepalive}`);
    }

    lines.push("    amnezia-wg-option:");
    lines.push(`      jc: ${data.jc}`);
    lines.push(`      jmin: ${data.jmin}`);
    lines.push(`      jmax: ${data.jmax}`);
    lines.push(`      s1: ${data.s1}`);
    lines.push(`      s2: ${data.s2}`);
    lines.push(`      s3: ${data.s3}`);
    lines.push(`      s4: ${data.s4}`);
    lines.push(`      h1: ${data.h1}`);
    lines.push(`      h2: ${data.h2}`);
    lines.push(`      h3: ${data.h3}`);
    lines.push(`      h4: ${data.h4}`);

    if (data.i1) lines.push(`      i1: "${data.i1}"`);
    else lines.push(`      i1: ""`);
    if (data.i2) lines.push(`      i2: "${data.i2}"`);
    else lines.push(`      i2: ""`);
    if (data.i3) lines.push(`      i3: "${data.i3}"`);
    else lines.push(`      i3: ""`);
    if (data.i4) lines.push(`      i4: "${data.i4}"`);
    else lines.push(`      i4: ""`);
    if (data.i5) lines.push(`      i5: "${data.i5}"`);
    else lines.push(`      i5: ""`);

    if (data.j1) lines.push(`      j1: "${data.j1}"`);
    if (data.j2) lines.push(`      j2: "${data.j2}"`);
    if (data.j3) lines.push(`      j3: "${data.j3}"`);
    if (data.itime) lines.push(`      itime: ${data.itime}`);

    return lines;
  }

  private renderAwg2Proxy(data: Extract<ParsedData, { protocol: "awg2" }>): string[] {
    const lines: string[] = [
      `  - name: "${data.name}"`,
      "    type: wireguard",
      `    server: ${data.server}`,
      `    port: ${data.port}`,
      `    ip: ${data.ip}`,
      `    private-key: ${data.privateKey}`,
      `    public-key: ${data.publicKey}`,
    ];

    if (data.ipv6) {
      lines.push(`    ipv6: ${data.ipv6}`);
    }

    if (data.preSharedKey) {
      lines.push(`    pre-shared-key: ${data.preSharedKey}`);
    }

    lines.push("    udp: true");

    if (data.reserved.length > 0) {
      lines.push(`    reserved: [${data.reserved.join(", ")}]`);
    }

    if (data.mtu) {
      lines.push(`    mtu: ${data.mtu}`);
    }

    if (data.persistentKeepalive) {
      lines.push(`    persistent-keepalive: ${data.persistentKeepalive}`);
    }

    lines.push("    amnezia-wg-option:");
    lines.push(`      jc: ${data.jc}`);
    lines.push(`      jmin: ${data.jmin}`);
    lines.push(`      jmax: ${data.jmax}`);
    lines.push(`      s1: ${data.s1}`);
    lines.push(`      s2: ${data.s2}`);
    lines.push(`      s3: ${data.s3}`);
    lines.push(`      s4: ${data.s4}`);
    lines.push(`      h1: "${data.h1}"`);
    lines.push(`      h2: "${data.h2}"`);
    lines.push(`      h3: "${data.h3}"`);
    lines.push(`      h4: "${data.h4}"`);

    if (data.i1) lines.push(`      i1: "${data.i1}"`);
    else lines.push(`      i1: ""`);
    if (data.i2) lines.push(`      i2: "${data.i2}"`);
    else lines.push(`      i2: ""`);
    if (data.i3) lines.push(`      i3: "${data.i3}"`);
    else lines.push(`      i3: ""`);
    if (data.i4) lines.push(`      i4: "${data.i4}"`);
    else lines.push(`      i4: ""`);
    if (data.i5) lines.push(`      i5: "${data.i5}"`);
    else lines.push(`      i5: ""`);

    return lines;
  }

  private loadWhitelistRules(): string[] {
    const rulesPath = resolve(import.meta.dirname, "../../utils/clash_rules.txt");

    try {
      return readFileSync(rulesPath, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  }
}

export { ClashConfigGenerator };
