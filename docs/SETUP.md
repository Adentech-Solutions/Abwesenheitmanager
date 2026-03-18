# Setup Guide

Follow these steps to set up the Absence Management App for development and production.

## Prerequisites
- **Node.js**: v18 or later.
- **MongoDB**: A local instance or MongoDB Atlas.
- **Azure AD / Entra ID**: Access to create an App Registration.

---

## 1. Microsoft Entra ID (Azure AD) Setup
1. Create a new **App Registration** in the Entra ID portal.
2. Set the **Redirect URI** to: `http://localhost:3000/api/auth/callback/azure-ad`.
3. Generate a **Client Secret**.
4. Add the following **API Permissions** (Delegated):
   - `User.Read`
   - `User.ReadBasic.All`
   - `User.Read.All`
   - `Calendars.ReadWrite`
   - `MailboxSettings.ReadWrite`
   - `Mail.Send`
   - `Chat.ReadWrite`
   - `offline_access`
5. Click **Grant admin consent** for those permissions.

---

## 2. Environment Variables
Copy `.env.example` to `.env.local` and fill in the following:

| Variable | Description |
| :--- | :--- |
| `MONGODB_URI` | Your MongoDB connection string. |
| `AZURE_AD_CLIENT_ID` | From Entra ID App Registration. |
| `AZURE_AD_CLIENT_SECRET` | From Entra ID App Registration. |
| `AZURE_AD_TENANT_ID` | From Entra ID App Registration. |
| `NEXTAUTH_SECRET` | Randomized string for session security. |
| `ENCRYPTION_KEY` | 32-byte hex string for data encryption. |

---

## 3. Installation & First Run
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` and sign in using your Entra ID account.

---

## 4. Granting Admin Role
By default, the first user is an `employee` or `manager` (if they have direct reports).
To grant `admin` permissions:
1. Connect to your MongoDB.
2. Update the user document where `email` matches your account:
   ```javascript
   db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
   ```
3. Sign out and sign in again.
