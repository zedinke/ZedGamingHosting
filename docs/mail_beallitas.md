# Saját levelezoszerver osszefoglalo

## Hasznalat
- SMTP alkalmazas: mail.zedgaminghosting.hu:587, STARTTLS, autentikacio kotelezo.
- IMAP kliens: mail.zedgaminghosting.hu:993, TLS.
- Felhasznalok:
  - noreply@zedgaminghosting.hu / jOACraLQQngnHNPLkgpnz3+qn
  - zedin@zedgaminghosting.hu / WR2JWInsqFbSPgbAUHxVpkCLn
- Alias: info@zedgaminghosting.hu -> zedin@zedgaminghosting.hu

## DNS beallitasok (hozzaadni)
- MX: zedgaminghosting.hu -> mail.zedgaminghosting.hu (prio 10)
- SPF (TXT, zedgaminghosting.hu): v=spf1 mx a:mail.zedgaminghosting.hu ~all
- DKIM (TXT, dkim2025._domainkey.zedgaminghosting.hu):
  - v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvICHQYdnW26yUqC+G0v8Zj/TlPuN8Cn8/O/HFQCRC+GiPK756pK0AuybUURUfm8kgW5GDN7uGzp1G/bwFybPvBB/0PD4E1Nlc49+7hfyb91cHQQKNi4FhJ3mpFeOSZku1fonPM7dcrfqmqENtOiZocbPm75BkUvktmX+DI5bE+2wg77gceAwmn7fAMi9f3HMbJjpep6dDmKod6j3MqpGvczowDGNxrhsw8f1NB5KtNT7LTOLm1aCnYWOaH1olcfwy8Rc7bOLAVvJy6LIwraTkJ5UZO46pTWCLzpWr5aH61xhLG7OR+RVJ9JS3nJyYYThMFWmyk3ebUThwqdILmj8WQIDAQAB
- DMARC (TXT, _dmarc.zedgaminghosting.hu): v=DMARC1; p=quarantine; rua=mailto:zedin@zedgaminghosting.hu; ruf=mailto:zedin@zedgaminghosting.hu; fo=1; adkim=s; aspf=s; pct=100

## PTR
- Allitsd be: 116.203.226.140 -> mail.zedgaminghosting.hu (jelenleg static.140.226.203.116.clients.your-server.de)

## Teszteles
1) Varj DNS/PTR propagaciora, majd kuldj tesztet mail-tester.com-ra noreply@ cimrol.
2) Kuldo-fogado teszt: kuldj levelt noreply@ es zedin@ cimre, ellenorizd IMAP-pal a bejovot; info@-rol erkezo levelek menjenek a zedin fiokba.
3) Nezd meg a fejlécben az SPF/DKIM/DMARC eredmenyeket es Rspamd header-t.

## App SMTP
- Beallitas: host mail.zedgaminghosting.hu, port 587, STARTTLS, user noreply@zedgaminghosting.hu, jelszo fent.
- Jelszot tarold titkosan (pl. env/secret manager).

## Megjegyzes
- LE tanusitvany automatikusan megujul; postfix/dovecot/rspamd konfiguracio kesz.
