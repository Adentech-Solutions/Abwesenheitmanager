# API Documentation

This document describes the API endpoints available in the Absence Management App.

## Authentication & Authorization
Most endpoints require an active session and specific roles. Authentication is handled via NextAuth with Azure AD / Entra ID.

| Role | Description |
| :--- | :--- |
| `employee` | Regular user, can manage own absences. |
| `teamlead` | Can view team absences and manage own. |
| `manager` | Can approve absences for direct reports. |
| `hr_manager` | Full access to absences, departments, and user data. |
| `admin` | System-wide configuration and user management. |

---

## Absences

### `GET /api/absences`
Returns a list of absences for the current user.
- **Auth**: `employee`+
- **Response**: `Absence[]`

### `POST /api/absences`
Creates a new absence request.
- **Auth**: `employee`+
- **Body**:
  ```json
  {
    "type": "vacation | sick | training | parental",
    "startDate": "2024-01-01",
    "endDate": "2024-01-05",
    "isHalfDay": false,
    "reason": "Optional description",
    "substitute": { "email": "..." }
  }
  ```

---

## Approvals

### `POST /api/approvals/{id}/approve`
Approves an absence request.
- **Auth**: `manager`, `teamlead`, `hr_manager`, `admin`
- **Side Effects**:
  - Updates vacation balance.
  - Creates Outlook calendar event.
  - Sets Outlook auto-reply.
  - Sends Teams notifications.

### `POST /api/approvals/{id}/reject`
Rejects an absence request.
- **Auth**: `manager`, `teamlead`, `hr_manager`, `admin`
- **Body**: `{ "reason": "Reason for rejection" }`

---

## Users & Profiles

### `GET /api/profile`
Returns the profile of the currently logged-in user.
- **Auth**: `employee`+

### `GET /api/users`
Returns a list of all users (paginated).
- **Auth**: `hr_manager`, `admin`

---

## Admin & Settings

### `GET /api/settings/company`
Returns company-wide settings (e.g., default vacation days).
- **Auth**: `admin`

### `POST /api/admin/users/sync`
Triggers a manual sync with Entra ID or Personio.
- **Auth**: `admin`
