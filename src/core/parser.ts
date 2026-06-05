import { inflateSync } from "node:zlib";

interface VlessParsedData {
  protocol: "vless";
  uuid: string;
  server: string;
  port: number;
  flow: string;
  sni: string;
  publicKey: string;
  shortId: string;
  clientFingerprint: string;
  network: string;
  security: string;
}

interface Hysteria2ParsedData {
  protocol: "hysteria2";
  server: string;
  port: number;
  password: string;
  sni: string;
  skipCertVerify: boolean;
  obfs: string;
  obfsPassword: string;
  pinSha256: string;
  name: string;
  alpn: string[];
  clientFingerprint: string;
}

interface AwgParsedData {
  protocol: "awg";
  server: string;
  port: number;
  privateKey: string;
  publicKey: string;
  ip: string;
  ipv6: string;
  preSharedKey: string;
  reserved: number[];
  mtu: number;
  persistentKeepalive: number;
  name: string;
  jc: number;
  jmin: number;
  jmax: number;
  s1: number;
  s2: number;
  s3: number;
  s4: number;
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  i1: string;
  i2: string;
  i3: string;
  i4: string;
  i5: string;
  j1: string;
  j2: string;
  j3: string;
  itime: number;
}

interface Awg2ParsedData {
  protocol: "awg2";
  server: string;
  port: number;
  privateKey: string;
  publicKey: string;
  ip: string;
  ipv6: string;
  preSharedKey: string;
  reserved: number[];
  mtu: number;
  persistentKeepalive: number;
  name: string;
  jc: number;
  jmin: number;
  jmax: number;
  s1: number;
  s2: number;
  s3: number;
  s4: number;
  h1: string;
  h2: string;
  h3: string;
  h4: string;
  i1: string;
  i2: string;
  i3: string;
  i4: string;
  i5: string;
}

type ParsedData = VlessParsedData | Hysteria2ParsedData | AwgParsedData | Awg2ParsedData;

interface AwgJsonContainer {
  H1?: string;
  H2?: string;
  H3?: string;
  H4?: string;
  I1?: string;
  I2?: string;
  I3?: string;
  I4?: string;
  I5?: string;
  J1?: string;
  J2?: string;
  J3?: string;
  Jc?: string;
  Jmin?: string;
  Jmax?: string;
  S1?: string;
  S2?: string;
  S3?: string;
  S4?: string;
  Itime?: string;
  hostName?: string;
  port?: number | string;
  client_priv_key?: string;
  server_pub_key?: string;
  client_ip?: string;
  psk_key?: string;
  mtu?: string;
  persistent_keep_alive?: string;
  protocol_version?: string;
  subnet_address?: string;
  last_config?: string;
  dns1?: string;
  dns2?: string;
}

interface VpnJson {
  containers?: Array<{
    awg?: AwgJsonContainer;
    container?: string;
  }>;
  description?: string;
  hostName?: string;
  dns1?: string;
  dns2?: string;
}

class VlessLinkParser {
  parse(link: string): ParsedData {
    if (typeof link !== "string" || link.trim().length === 0) {
      throw new Error("Ссылка пуста.");
    }

    const trimmed = link.trim();

    if (trimmed.startsWith("vpn://")) {
      return this.parseVpn(trimmed);
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(trimmed);
    } catch {
      throw new Error("Некорректный формат ссылки.");
    }

    if (parsedUrl.protocol === "vless:") {
      return this.parseVless(parsedUrl);
    }

    if (parsedUrl.protocol === "hy2:" || parsedUrl.protocol === "hysteria2:") {
      return this.parseHysteria2(parsedUrl);
    }

    throw new Error("Поддерживаются только ссылки vless://, hy2:// и vpn://");
  }

  private parseVpn(link: string): AwgParsedData | Awg2ParsedData {
    const payload = link.slice("vpn://".length);

    const base64 = payload.replace(/_/g, "/").replace(/-/g, "+");
    const raw = Buffer.from(base64, "base64");

    if (raw.length < 5) {
      throw new Error("Некорректный формат vpn:// ссылки: данные слишком короткие.");
    }

    const jsonBytes = inflateSync(raw.subarray(4));

    let vpn: VpnJson;
    try {
      vpn = JSON.parse(jsonBytes.toString("utf8"));
    } catch {
      throw new Error("Не удалось разобрать JSON из vpn:// ссылки.");
    }

    const awgContainer = vpn.containers?.[0]?.awg;
    if (!awgContainer) {
      throw new Error("Контейнер awg не найден в vpn:// ссылке.");
    }

    let lastConfig: AwgJsonContainer | null = null;
    if (awgContainer.last_config) {
      try {
        lastConfig = JSON.parse(awgContainer.last_config);
      } catch {
        // ignore malformed last_config
      }
    }

    const lc = lastConfig ?? {};

    const server = lc.hostName || awgContainer.hostName || vpn.hostName || "";
    const port = Number(lc.port || awgContainer.port) || 443;
    const protocolVersion = awgContainer.protocol_version || "1";
    const name = protocolVersion === "2" ? "AWG 2.0" : "AWG";

    if (!server) {
      throw new Error("Сервер не найден в vpn:// ссылке.");
    }

    const clientIp = lc.client_ip || awgContainer.client_ip || "";
    const subnet = awgContainer.subnet_address || "";
    const ip = clientIp
      ? (clientIp.includes("/") ? clientIp : `${clientIp}/32`)
      : (subnet ? `${subnet.split(".")[0]}.${subnet.split(".")[1]}.${subnet.split(".")[2]}.2/32` : "");

    if (!ip) {
      throw new Error("IP адрес клиента не найден в vpn:// ссылке.");
    }

    const baseFields = {
      server,
      port,
      privateKey: lc.client_priv_key || awgContainer.client_priv_key || "",
      publicKey: lc.server_pub_key || awgContainer.server_pub_key || "",
      ip,
      ipv6: "",
      preSharedKey: lc.psk_key || awgContainer.psk_key || "",
      reserved: [] as number[],
      mtu: Number(lc.mtu || awgContainer.mtu) || 0,
      persistentKeepalive: Number(lc.persistent_keep_alive || awgContainer.persistent_keep_alive) || 0,
      name,
      jc: Number(awgContainer.Jc) || 0,
      jmin: Number(awgContainer.Jmin) || 0,
      jmax: Number(awgContainer.Jmax) || 0,
      s1: Number(awgContainer.S1) || 0,
      s2: Number(awgContainer.S2) || 0,
      s3: Number(awgContainer.S3) || 0,
      s4: Number(awgContainer.S4) || 0,
      i1: awgContainer.I1 || "",
      i2: awgContainer.I2 || "",
      i3: awgContainer.I3 || "",
      i4: awgContainer.I4 || "",
      i5: awgContainer.I5 || "",
    };

    if (protocolVersion === "2") {
      return {
        protocol: "awg2",
        ...baseFields,
        h1: awgContainer.H1 || "",
        h2: awgContainer.H2 || "",
        h3: awgContainer.H3 || "",
        h4: awgContainer.H4 || "",
      };
    }

    return {
      protocol: "awg",
      ...baseFields,
      h1: Number(awgContainer.H1) || 0,
      h2: Number(awgContainer.H2) || 0,
      h3: Number(awgContainer.H3) || 0,
      h4: Number(awgContainer.H4) || 0,
      j1: awgContainer.J1 || "",
      j2: awgContainer.J2 || "",
      j3: awgContainer.J3 || "",
      itime: Number(awgContainer.Itime) || 0,
    };
  }

  private parseVless(parsedUrl: URL): VlessParsedData {
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
      security: parsedUrl.searchParams.get("security") || "reality",
    };
  }

  private parseHysteria2(parsedUrl: URL): Hysteria2ParsedData {
    const username = decodeURIComponent(parsedUrl.username || "");
    const secret = decodeURIComponent(parsedUrl.password || "");
    const server = parsedUrl.hostname;
    const port = Number(parsedUrl.port) || 443;

    if (!secret && !username) {
      throw new Error("Пароль Hysteria2 не найден в ссылке.");
    }

    if (!server) {
      throw new Error("Сервер не найден.");
    }

    const name = parsedUrl.hash
      ? decodeURIComponent(parsedUrl.hash.slice(1))
      : server;

    const sni = parsedUrl.searchParams.get("sni") || server;

    const clientFingerprint = parsedUrl.searchParams.get("fp") || "chrome";

    const alpnRaw = parsedUrl.searchParams.get("alpn") || "h3";
    const alpn = alpnRaw.split(",").map((a) => a.trim()).filter(Boolean);

    let obfs = parsedUrl.searchParams.get("obfs") || "";
    let obfsPassword = parsedUrl.searchParams.get("obfs-password") || "";

    const fmRaw = parsedUrl.searchParams.get("fm");
    if (fmRaw && !obfsPassword) {
      try {
        const fm = JSON.parse(decodeURIComponent(fmRaw));
        for (const item of fm.udp ?? []) {
          if (item.type === "salamander") {
            obfsPassword = item.settings?.password ?? "";
            obfs = obfs || "salamander";
          }
        }
      } catch {
        // ignore malformed fm
      }
    }

    return {
      protocol: "hysteria2",
      server,
      port,
      password: username ? `${username}:${secret}` : secret,
      sni,
      skipCertVerify: this.parseBooleanParam(parsedUrl.searchParams.get("insecure")),
      obfs,
      obfsPassword,
      pinSha256: parsedUrl.searchParams.get("pinSHA256") || "",
      name,
      alpn,
      clientFingerprint,
    };
  }

  private parseBooleanParam(value: string | null): boolean {
    return value === "1" || value === "true";
  }
}

export { VlessLinkParser };
export type { VlessParsedData, Hysteria2ParsedData, AwgParsedData, Awg2ParsedData, ParsedData };
