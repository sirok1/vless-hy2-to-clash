class ClashConfigGenerator {
  generate(data) {
    return `# Основные настройки
port: 7890
socks-port: 7891
allow-lan: true
mode: rule
log-level: info
ipv6: false

proxies:
  - name: "VLESS-Reality"
    type: vless
    server: ${data.server}
    port: ${data.port}
    uuid: "${data.uuid}"
    network: ${data.network}
    tls: true
    udp: true
    flow: "${data.flow}"
    servername: ${data.sni}
    client-fingerprint: ${data.clientFingerprint}
    reality-opts:
      public-key: "${data.publicKey}"
      short-id: "${data.shortId}"

proxy-groups:
  - name: "Proxy-Select"
    type: select
    proxies:
      - "VLESS-Reality"
      - DIRECT

rules:
  # Эти сайты будут открываться НАПРЯМУЮ
  # -------------------------------------
  # Yanima
  - DOMAIN-SUFFIX,yanima.space,DIRECT
  - DOMAIN-SUFFIX,yanima.online,DIRECT
  # -------------------------------------
  # Yandex
  - DOMAIN-SUFFIX,yandex.ru,DIRECT
  - DOMAIN-SUFFIX,yandex.net,DIRECT
  - DOMAIN-SUFFIX,kinopoisk.ru,DIRECT
  # -------------------------------------
  # Wildberries
  - DOMAIN-SUFFIX,geobasket.ru,DIRECT
  - DOMAIN-SUFFIX,wbcontent.net,DIRECT
  - DOMAIN-SUFFIX,wb.ru,DIRECT
  - DOMAIN-SUFFIX,wbbasket.ru,DIRECT
  - DOMAIN-SUFFIX,wildberries.ru,DIRECT
  # -------------------------------------
  - DOMAIN-SUFFIX,ivi.ru,DIRECT
  - DOMAIN-SUFFIX,tvoe.live,DIRECT
  - DOMAIN-SUFFIX,amediateka.ru,DIRECT
  - DOMAIN-SUFFIX,kinoflex.ru,DIRECT
  - DOMAIN-SUFFIX,vk.com,DIRECT
  - DOMAIN-SUFFIX,mail.ru,DIRECT
  - DOMAIN-SUFFIX,datacloudmail.ru,DIRECT
  - DOMAIN-SUFFIX,ozon.ru,DIRECT
  - DOMAIN-SUFFIX,dns-shop.ru,DIRECT
  - DOMAIN-SUFFIX,tome.ge,DIRECT
  - DOMAIN-SUFFIX,remanga.org,DIRECT
  - DOMAIN-SUFFIX,hentaicdn.org,DIRECT
  - DOMAIN-SUFFIX,2ip.ru,DIRECT
  
  # Торрент трафик
  - PROCESS-NAME,bittorrent.exe,DIRECT
  - PROCESS-NAME,uTorrent.exe,DIRECT
  - PROCESS-NAME,utorrent.exe,DIRECT
  - PROCESS-NAME,uTorrentWeb.exe,DIRECT
  - PROCESS-NAME,qBittorrent.exe,DIRECT
  - PROCESS-NAME,qbittorrent.exe,DIRECT
  - PROCESS-NAME,transmission.exe,DIRECT
  - PROCESS-NAME,transmission-qt.exe,DIRECT
  - PROCESS-NAME,transmission-daemon.exe,DIRECT
  - PROCESS-NAME,deluge.exe,DIRECT
  - PROCESS-NAME,BitComet.exe,DIRECT
  - PROCESS-NAME,Tixati.exe,DIRECT
  - PROCESS-NAME,BiglyBT.exe,DIRECT
  - PROCESS-NAME,Vuze.exe,DIRECT
  - PROCESS-NAME,FreeDownloadManager.exe,DIRECT
  - PROCESS-NAME,PicoTorrent.exe,DIRECT
  - PROCESS-NAME,Tribler.exe,DIRECT
  - PROCESS-NAME,FrostWire.exe,DIRECT
  - PROCESS-NAME,BitSpirit.exe,DIRECT
  - PROCESS-NAME,Thunder.exe,DIRECT

  # Steam
  - PROCESS-NAME,steam.exe,DIRECT
  - PROCESS-NAME,steamwebhelper.exe,DIRECT
  
  # Всё остальное через прокси
  - MATCH,Proxy-Select
`;
  }
}

module.exports = {
  ClashConfigGenerator
};
