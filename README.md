# 🏖️ Absence Management App

Modern absence and vacation management system with Microsoft 365 integration.

## 🚀 Features

- ✅ Absence requests (Vacation, Sick Leave, Training, Parental Leave)
- ✅ Manager approval workflow via Teams & Email
- ✅ Automatic Outlook calendar integration
- ✅ Auto-reply configuration
- ✅ Conflict detection & warnings
- ✅ Vacation balance tracking (30 days/year)
- ✅ Intelligent suggestions (bridge days, optimal times)
- ✅ Employee, Manager, and Admin dashboards
- ✅ Teams notifications
- ✅ Company holidays management

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- MongoDB (Atlas or local)
- Azure AD / Entra ID tenant
- Microsoft 365 account
- (Optional) Teams developer account

## 🔧 Setup Instructions

### 1. Clone and Install

```bash
# Navigate to project
cd absence-management-app

# Install dependencies
npm install
```

### 2. Configure Environment Variables

```bash
# Copy example file
cp .env.example .env.local

# Edit .env.local with your credentials
```

**Required Variables:**

- `MONGODB_URI`: Your MongoDB connection string
- `AZURE_AD_CLIENT_ID`: Azure App Registration Client ID
- `AZURE_AD_CLIENT_SECRET`: Azure App Registration Secret
- `AZURE_AD_TENANT_ID`: Your Azure Tenant ID
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`

### 3. Azure App Registration Setup

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "App registrations"
3. Create new registration or use existing
4. Add these **API Permissions**:
   - `User.Read`
   - `User.ReadBasic.All`
   - `User.Read.All` (for reading managers)
   - `Calendars.ReadWrite`
   - `MailboxSettings.ReadWrite`
   - `Mail.Send`
   - `Chat.ReadWrite`
5. Grant admin consent
6. Create client secret
7. Copy Client ID, Tenant ID, and Secret to `.env.local`

### 4. MongoDB Setup

**Option A: MongoDB Atlas (Recommended)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster
3. Get connection string
4. Add to `.env.local`

**Option B: Local MongoDB**
```bash
# Install MongoDB locally
# Connection string: mongodb://localhost:27017/absence-management
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📦 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Authentication**: NextAuth.js, Azure AD
- **UI**: Tailwind CSS, Fluent UI
- **Integration**: Microsoft Graph API
- **Notifications**: Teams, Email

## 📁 Project Structure

```
src/
├── app/              # Next.js App Router
│   ├── api/          # Backend API routes
│   ├── dashboard/    # Employee dashboard
│   ├── manager/      # Manager dashboard
│   └── admin/        # Admin panel
├── components/       # React components
├── lib/              # Utility functions
├── models/           # MongoDB models
├── types/            # TypeScript types
└── hooks/            # Custom React hooks
```

## 🎯 Usage

### For Employees
1. Login with Microsoft account
2. View vacation balance
3. Request absence
4. Track approval status

### For Managers
1. Review pending approvals
2. Approve/reject via Teams or web
3. View team calendar
4. Get conflict warnings

### For HR/Admin
1. Manage templates
2. Set company holidays
3. View statistics
4. Configure settings

## 🔒 Security

- OAuth 2.0 authentication via Azure AD
- Secure API routes with middleware
- Environment variables for sensitive data
- HTTPS in production required

## 🐛 Troubleshooting

**MongoDB connection error:**
- Check MONGODB_URI in .env.local
- Verify IP whitelist in MongoDB Atlas
- Ensure network connectivity

**Azure AD authentication fails:**
- Verify Client ID, Secret, and Tenant ID
- Check API permissions granted
- Ensure redirect URIs configured

**Graph API errors:**
- Verify all required permissions granted
- Check admin consent given
- Validate token scopes

## 📚 API Documentation

### Absences
- `GET /api/absences` - List absences
- `POST /api/absences` - Create absence
- `PUT /api/absences/[id]` - Update absence
- `DELETE /api/absences/[id]` - Delete absence

### Approvals
- `GET /api/approvals` - Pending approvals
- `POST /api/approvals/[id]/approve` - Approve
- `POST /api/approvals/[id]/reject` - Reject

### Users
- `GET /api/users` - List users
- `GET /api/users/manager` - Get manager

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Azure App Service
```bash
npm run build
# Follow Azure deployment guide
```

## 📝 License

Private - Internal use only

## 🤝 Support

For issues or questions, contact IT support.

---

**Built with ❤️ for efficient absence management**