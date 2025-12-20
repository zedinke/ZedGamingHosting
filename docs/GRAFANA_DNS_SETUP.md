# Grafana DNS Konfiguráció

## Áttekintés

A Grafana dashboard elérhető a `https://grafana.zedgaminghosting.hu` címen keresztül, ha a DNS rekord helyesen van beállítva.

## DNS Beállítások

### Szükséges DNS Rekord

Adj hozzá egy új A rekordot a DNS szolgáltatódnál (pl. Cloudflare, GoDaddy, stb.):

```
Type: A
Name: grafana
Value: 116.203.226.140 (a szerver IP címe)
TTL: Auto vagy 3600
Proxy: Kikapcsolva (Cloudflare esetén)
```

### Teljes domain

A konfigurált domain: `grafana.zedgaminghosting.hu`

## Traefik Routing

A Traefik már konfigurálva van a Grafana forgalom fogadására:

**Fájl:** `dynamic.yml`

```yaml
http:
  routers:
    grafana-http:
      rule: "Host(`grafana.zedgaminghosting.hu`)"
      service: grafana
      entryPoints:
        - web
      middlewares:
        - https-redirect

    grafana-https:
      rule: "Host(`grafana.zedgaminghosting.hu`)"
      service: grafana
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt

  services:
    grafana:
      loadBalancer:
        servers:
          - url: "http://zed-grafana:3000"
```

## SSL/TLS Tanúsítvány

A Let's Encrypt automatikusan generál HTTPS tanúsítványt a `grafana.zedgaminghosting.hu` domain-hez, amikor:
1. A DNS rekord helyesen van beállítva
2. A domain elérhető a szerveren
3. Traefik fogadja az első HTTPS kérést

## Elérés

### Belső hozzáférés (Docker hálózaton)
```bash
curl http://zed-grafana:3000
```

### Külső hozzáférés (böngészőből)
```
https://grafana.zedgaminghosting.hu
```

### Alapértelmezett bejelentkezés
- **Felhasználónév:** `admin`
- **Jelszó:** A `GRAFANA_ADMIN_PASSWORD` környezeti változó értéke (alapértelmezett: `changeme`)

## Ellenőrzés

### DNS feloldás ellenőrzése
```bash
nslookup grafana.zedgaminghosting.hu
```

A válaszban a következő IP címnek kell megjelennie: `116.203.226.140`

### Grafana elérhetőség ellenőrzése
```bash
curl -I https://grafana.zedgaminghosting.hu
```

Sikeres válasz esetén `HTTP/2 200` vagy átirányítás `HTTP/2 302` státuszkódot kell kapnunk.

## Portok

- **Belső port:** 3000 (Grafana konténer)
- **Külső port:** 3002 (közvetlen Docker port - nem ajánlott production környezetben)
- **HTTPS port:** 443 (Traefik proxy-n keresztül)

## Provisioned Dashboards

A következő dashboardok automatikusan betöltődnek:

1. **Node Exporter Full (ID: 1860)** - Rendszer metrikák
   - CPU, memória, disk, hálózat használat
   - Rendszer terhelés és folyamatok

2. **Docker Containers (ID: 19792)** - Docker konténer metrikák
   - Konténer CPU és memória használat
   - Hálózati forgalom
   - Konténer állapotok

## Prometheus Datasource

Automatikusan provisioned datasource:
- **Név:** Prometheus
- **URL:** `http://prometheus:9090`
- **Típus:** Prometheus
- **Alapértelmezett:** Igen

## Troubleshooting

### Grafana nem érhető el

1. Ellenőrizd, hogy a DNS rekord létezik és propagálódott:
   ```bash
   nslookup grafana.zedgaminghosting.hu
   ```

2. Ellenőrizd a Grafana konténer státuszát:
   ```bash
   docker ps | grep grafana
   ```

3. Ellenőrizd a Grafana logokat:
   ```bash
   docker logs zed-grafana --tail 50
   ```

4. Ellenőrizd a Traefik logokat:
   ```bash
   docker logs zed-traefik --tail 50
   ```

### SSL tanúsítvány hibák

Ha a Let's Encrypt tanúsítvány generálása sikertelen:

1. Ellenőrizd, hogy a domain elérhető:
   ```bash
   curl -I http://grafana.zedgaminghosting.hu/.well-known/acme-challenge/test
   ```

2. Nézd meg a Traefik ACME logokat:
   ```bash
   docker exec zed-traefik cat /letsencrypt/acme.json
   ```

3. Kényszerítsd újra a tanúsítvány generálását a Traefik újraindításával:
   ```bash
   docker compose restart traefik
   ```

## Biztonsági javaslatok

1. **Változtasd meg az alapértelmezett admin jelszót** a `GRAFANA_ADMIN_PASSWORD` környezeti változóban
2. **Kapcsold ki az anonim hozzáférést** (már alapértelmezetten ki van kapcsolva)
3. **Konfiguráld az OAuth-ot** GitHub, Google vagy más provider-rel (opcionális)
4. **Használj csak HTTPS-t** - a HTTP automatikusan átirányít HTTPS-re
5. **Korlátozd a hozzáférést IP címek alapján** Traefik middleware-rel (opcionális)

## Következő lépések

1. Adj hozzá A rekordot a DNS szolgáltatódnál
2. Várj 5-10 percet a DNS propagációra
3. Nyisd meg a `https://grafana.zedgaminghosting.hu` címet böngészőben
4. Jelentkezz be `admin` felhasználónévvel és a beállított jelszóval
5. Fedezd fel a provisioned dashboardokat
6. Készíts egyedi dashboardokat az API HTTP metrikákhoz
