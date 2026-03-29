# Absence Management App (Freyetag)

A modern, enterprise-grade solution for managing employee absences, holiday requests, and handovers. Built with Next.js, and strictly integrated with Microsoft 365 (Entra ID, Microsoft Graph, and Teams).

![Architecture Overview](./docs/diagrams/architecture-overview.svg)

---

## 🌟 Key Features
- **Smart Engine**: Visual **Jahresplaner** for optimal team coverage.
- **Vacation Suggestions**: Pro-active suggestions for bridge days and holiday optimization.
- **Conflict Warning**: Automatic detection of overlapping absences or low department capacity.
- **SSO Authentication**: Secure sign-in with Microsoft Entra ID (Azure AD).
- **Holiday Requests**: Intuitive UI for creating, managing, and canceling requests.
- **Manager Approval**: Real-time Teams notifications with Interactive Adaptive Cards.
- **M365 Automation**:
  - Automatic **Outlook Calendar** sync on approval.
  - Automatic **Outlook Out-of-office** (Auto-Reply) setup.
  - **Teams Bot** notifications for approvals and handovers.
- **Handover Management**: Integrated task handover with automated return prompts.
- **Enterprise RBAC**: Fine-grained 5-role system (Employee, Team Lead, Manager, HR Manager, Admin).
- **External Sync**: Native two-way synchronization with **Personio** (Optional).

---

## 🏗️ Technical Stack
| Category | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14, React, Tailwind CSS, shadcn/ui |
| **Backend** | Next.js API Routes (Serverless) |
| **Database** | MongoDB with Mongoose |
| **Auth** | NextAuth.js (Entra ID Provider) |
| **Integrations** | Microsoft Graph API, Teams Bot Framework, Personio API |

---

## 📚 Documentation
- [**Setup Guide**](./docs/SETUP.md): Instructions for setting up Entra ID, MongoDB, and the development environment.
- [**Architecture Overview**](./docs/ARCHITECTURE.md): Detailed system design, data models, and deployment diagrams.
- [**API Documentation**](./docs/API.md): Endpoint reference and RBAC permission levels.

---

## 🚀 Quick Start
1.  **Clone the repository** and install dependencies: `npm install`.
2.  **Configure environment variables**: Copy `.env.example` to `.env.local` and add your Entra ID and MongoDB credentials.
3.  **Run the development server**: `npm run dev`.
4.  **Open [http://localhost:3000](http://localhost:3000)** and sign in.
