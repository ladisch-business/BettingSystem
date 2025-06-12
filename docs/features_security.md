# SECURITY Features

Sicherheitsanforderungen und Authentifizierungskonfiguration für das Projekt.

## Authentifizierung

### Hashing-Algorithmus
- **Methode:** argon2
- **Sicherheitslevel:** Sehr hoch (empfohlen)

### Session-Management
- **Session-Typ:** express-session
- **Sicherheit:** Server-basierte Sessions

## Passwort-Anforderungen

### Mindestanforderungen
- **Mindestlänge:** 8 Zeichen

### Zeichensatz-Anforderungen
- ✅ Großbuchstaben (A-Z) erforderlich
- ✅ Kleinbuchstaben (a-z) erforderlich
- ✅ Zahlen (0-9) erforderlich
- ✅ Sonderzeichen (!@#$%^&*) erforderlich

### Datenleck-Schutz
- ✅ HaveIBeenPwned API-Überprüfung aktiviert

### Beispiel für gültiges Passwort
```
Abc123!@#
```

## Implementierungsdetails

### Backend-Anforderungen
- Passwort-Validierung mit konfigurierten Regeln implementieren
- argon2 für sicheres Password-Hashing verwenden
- Empfohlene Argon2-Parameter: timeCost: 2, memoryCost: 65536, parallelism: 1

### Frontend-Anforderungen
- Client-seitige Passwort-Validierung implementieren
- Benutzerfreundliche Fehlermeldungen bei ungültigen Passwörtern
- HaveIBeenPwned API-Integration für Datenleck-Überprüfung
- k-Anonymity-Methode verwenden (nur SHA-1 Hash-Prefix übertragen)
- Fail-open Strategie bei API-Ausfällen

## Sicherheitsmaßnahmen

### Rate Limiting
- Login-Versuche: Max. 5 Versuche pro 15 Minuten
- Account-Sperrung: Nach 10 fehlgeschlagenen Versuchen für 30 Minuten

### Session-Sicherheit
- HttpOnly Cookies
- Secure Flag für HTTPS
- SameSite-Attribut: 'strict'
- Session-Timeout: 24 Stunden

### Datenschutz
- Passwörter werden niemals im Klartext gespeichert
- Sensible Daten werden vor Logging gefiltert
- GDPR-konforme Datenverarbeitung

## Abhängigkeiten

### Benötigte Dependencies
- argon2 - Password Hashing
- express-session - Session Management
- helmet - Security Headers
- express-rate-limit - Rate Limiting
- axios - HTTP Client für API-Calls

### Umgebungsvariablen
- SESSION_SECRET - Geheimer Schlüssel für Sessions/JWT

- RATE_LIMIT_WINDOW_MS - Zeitfenster für Rate Limiting (Standard: 900000ms)
- RATE_LIMIT_MAX_REQUESTS - Maximale Anfragen pro Zeitfenster (Standard: 5)

## Akzeptanzkriterien

- [ ] Passwort-Validierung funktioniert nach definierten Regeln
- [ ] argon2 Hashing ist korrekt implementiert
- [ ] express-session Session-Management funktioniert
- [ ] Rate Limiting ist aktiv
- [ ] Sicherheitstests bestanden
- [ ] Penetration Testing durchgeführt

## Security Audit Checklist

- [ ] OWASP Top 10 Vulnerabilities geprüft
- [ ] SQL Injection Prevention implementiert
- [ ] XSS Protection aktiv
- [ ] CSRF Protection konfiguriert
- [ ] Sichere Headers gesetzt (Helmet.js)
- [ ] Input Validation implementiert
- [ ] Error Handling ohne Informationsleckage
