# API Referenz - Freyetag Abwesenheitsverwaltung

Dieses Dokument bietet eine vollständige Übersicht über die REST-API der Freyetag Abwesenheitsverwaltung. Alle Endpunkte sind durch HTTPS und Rollenprüfung gesichert.

---

## 🔐 Rollen & Zugriff

Die Rollenprüfung erfolgt über den Header `Session.user.role`.

- **`employee`**: Standard Zugriff auf eigene Daten.
- **`teamlead`**: Zugriff auf das eigene Team (Department).
- **`manager`**: Zugriff auf zugewiesene Mitarbeiter.
- **`hr_manager`**: Globaler Lese- und Schreibzugriff auf Mitarbeiterdaten.
- **`admin`**: Vollständiger Systemzugriff.

---

## 📅 Abwesenheiten (Absences)

### `GET /api/absences`
- **Rollen**: `employee`, `teamlead`, `manager`, `hr_manager`, `admin`
- **Beschreibung**: Listet alle Abwesenheiten des aktuellen Nutzers auf.

### `POST /api/absences`
- **Rollen**: `employee`, `teamlead`, `manager`, `hr_manager`, `admin`
- **Beschreibung**: Erstellt einen neuen Abwesenheitsantrag.
- **Body**: `{ type: string, startDate: Date, endDate: Date, reason: string, substitute?: object }`

### `GET /api/absences/[id]`
- **Rollen**: `employee`, `teamlead`, `manager`, `hr_manager`, `admin`
- **Beschreibung**: Abrufen von Details einer spezifischen Abwesenheit (mit Ownership-Prüfung).

### `DELETE /api/absences/[id]`
- **Rollen**: `employee`, `admin`
- **Beschreibung**: Storniert eine Abwesenheit. Rückerstattung der Urlaubstage erfolgt automatisch.

![Stornierungs-Prozess](./diagrams/cancellation-refund.svg)

---

## ✅ Genehmigungen (Approvals)

### `GET /api/approvals`
- **Rollen**: `manager`, `hr_manager`, `admin`
- **Beschreibung**: Listet ausstehende Anträge zur Genehmigung auf.

### `POST /api/approvals/[id]/approve`
- **Rollen**: `manager`, `admin`
- **Beschreibung**: Genehmigt einen Antrag und löst Folgeaktionen aus (Outlook, Teams).

![Genehmigungs-Prozess](./diagrams/approval-flow.svg)

---

## 🛠️ Administration & Benutzer

### `GET /api/admin/users`
- **Rollen**: `hr_manager`, `admin`
- **Beschreibung**: Listet alle im System registrierten Benutzer auf.

### `POST /api/admin/users/sync`
- **Rollen**: `admin`
- **Beschreibung**: Manuelle Synchronisation von Benutzern aus dem Azure Entra ID.

---

## 📊 Analytics & Insights

### `GET /api/analytics/summary`
- **Rollen**: `hr_manager`, `admin`
- **Beschreibung**: Dashboard-Statistiken über Urlaubsverteilung und Auslastung.

### `GET /api/insights/suggestions`
- **Rollen**: `employee`, `teamlead`, `manager`, `hr_manager`, `admin`
- **Beschreibung**: Liefert Vorschläge für Brückentage und optimale Urlaubsplanung.

---

## 🔄 Integrationen & Cron Jobs

### `GET /api/cron/return-prompts`
- **Auth**: `Bearer ${CRON_SECRET}`
- **Beschreibung**: Sendet Rückkehr-Prompts an Mitarbeiter nach dem Urlaub.

### `POST /api/cron/personio-sync`
- **Auth**: `Bearer ${CRON_SECRET}`
- **Beschreibung**: Synchronisiert genehmigte Abwesenheiten mit dem Personio API.

![Personio Synchronisation](./diagrams/personio-sync.svg)
