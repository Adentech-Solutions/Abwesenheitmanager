
# Setup & Installation Guide - Freyetag Absence Management

Dieses Dokument führt Sie durch die Installation und Konfiguration der Freyetag Abwesenheitsverwaltung.

## 📋 Setup-Workflow

Der folgende Ablauf stellt die notwendigen Schritte für eine erfolgreiche Erstinstallation dar:

![Installation-Workflow](./diagrams/setup-workflow.svg)

---

## 📋 Voraussetzungen

- **Node.js**: Version 18.x oder höher
- **MongoDB**: MongoDB Atlas Cluster oder lokale MongoDB Instanz
- **Azure AD / Entra ID**: App Registration für SSO und Graph API
- **Optional**: Personio API API-Zugangsdaten (für Sync)
- **Optional**: Microsoft Teams Bot Framework (für Benachrichtigungen)

---

## 🔐 Azure AD / Entra ID Setup

1. Navigieren Sie zum **Entra ID Admin Center** > **App-Registrierungen** > **Neue Registrierung**.
2. **Name**: `Freyetag Absence App`
3. **Redirect URI**: `http://localhost:3000/api/auth/callback/azure-ad`
4. **Zertifikate & Geheimnisse**: Erstellen Sie ein neues Client Secret und bewahren Sie es sicher auf.
5. **API-Berechtigungen**: Fügen Sie folgende Microsoft Graph Berechtigungen hinzu:
   - `User.Read` (Anmeldung)
   - `User.Read.All` (Nutzer Synchronisation)
   - `Calendars.ReadWrite` (Kalender Einträge)
   - `Mail.Send` (E-Mail Benachrichtigungen)

---

## 🛠️ Umgebungsvariablen (Environment Variables)

Erstellen Sie eine `.env.local` Datei basierend auf der `.env.example`:

| Variable | Beschreibung | Beispiel |
| :--- | :--- | :--- |
| `MONGODB_URI` | Connection String für MongoDB | `mongodb+srv://...` |
| `ENTRA_ID_CLIENT_ID` | Client ID der App Registration | `000000-000...` |
| `ENTRA_ID_CLIENT_SECRET` | Client Secret der App Registration | `AbC...` |
| `ENTRA_ID_TENANT_ID` | Tenant ID Ihres Azure Mandanten | `111111-111...` |
| `NEXTAUTH_URL` | Basis URL der Anwendung | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Geheimer Schlüssel für NextAuth | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | Schlüssel für Datenverschlüsselung (32 char hex) | `64 bit hex string` |
| `CRON_SECRET` | API Key für Cron Job Authentifizierung | `mein-geheimnis` |
| `PERSONIO_CLIENT_ID` | Personio API Client ID (Optional) | `pers_id_...` |
| `PERSONIO_CLIENT_SECRET` | Personio API Secret (Optional) | `pers_sec_...` |

---

## 🚀 Installation & Erster Start

1. Repository klonen:
   ```bash
   git clone https://github.com/adentech/absence-management-app.git
   cd absence-management-app
   ```
2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```
3. Umgebungsvariablen konfigurieren:
   - Kopieren Sie `.env.example` nach `.env.local`
   - Befüllen Sie die Werte aus dem Azure Setup.
4. Anwendung im Entwicklungsmodus starten:
   ```bash
   npm run dev
   ```
5. Rufen Sie `http://localhost:3000` auf und melden Sie sich via Entra ID an.

---

## 👑 Erste Admin Rolle zuweisen

Das System weist neuen Nutzern standardmäßig die Rolle `employee` zu. Um die erste Admin-Rolle manuell zu vergeben (da die Admin UI sonst gesperrt ist):

1. Öffnen Sie Ihre MongoDB (z.B. MongoDB Compass oder Atlas UI).
2. Suchen Sie in der `users` Collection nach Ihrem Nutzer (E-Mail).
3. Setzen Sie das Feld `role` auf `"admin"`.
4. Laden Sie die Anwendung neu.

---

## 🤖 Teams Bot Einrichtung (Optional)

Für interaktive Adaptive Cards in Microsoft Teams:
1. Registrieren Sie einen Bot im **Azure Bot Service**.
2. Erhalten Sie `MICROSOFT_APP_ID` und `MICROSOFT_APP_PASSWORD`.
3. Tragen Sie diese in die `.env.local` ein (siehe `.env.example`).
