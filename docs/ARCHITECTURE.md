# Architecture Documentation

This document provides a high-level overview of the Absence Management App's architecture, data flow, and deployment.

## System Overview
The application is built with **Next.js**, **Tailwind CSS**, and **MongoDB**. It integrates with **Azure AD / Entra ID** for authentication and **Microsoft Graph API** for calendar and Teams notifications.

![Architecture Overview](./diagrams/architecture-overview.svg)

---

## Data Flow: Approval Process
The core logic of the application revolves around the absence approval workflow.

![Approval Flow](./diagrams/approval-flow.svg)

1. **Request**: An employee submits a request via the frontend.
2. **Notification**: The manager is notified via Teams with an Adaptive Card.
3. **Approval**: The manager approves the request via the API.
4. **Integration**: The system updates the vacation balance, creates a calendar event, sets an auto-reply, and notifies the employee.

---

## Data Model (ER Diagram)
The application uses a schema-based MongoDB approach via **Mongoose**.

![Data Model](./diagrams/data-model.svg)

- **User**: Stores Entra ID metadata, roles, and vacation balances.
- **Absence**: Stores the request details, status, and handover information.
- **Department**: Grouping for team leads and managers.

---

## Role-Based Access Control (RBAC)
The system uses a hierarchical role structure to manage permissions.

![RBAC States](./diagrams/rbac-states.svg)

Users are assigned roles that determine their access to specific API routes and UI components. Permissions are defined in `src/types/permissions.ts`.

---

## Deployment Architecture
The application is designed to be hosted on **Vercel** for the frontend and API routes, with a managed **MongoDB Atlas** instance for data.

![Deployment Architecture](./diagrams/deployment.svg)

- **Vercel**: Hosts the Next.js application and serverless functions.
- **MongoDB Atlas**: Managed database for persistence.
- **Entra ID**: Multi-tenant or single-tenant authentication.
- **Graph API**: Integration with Microsoft 365 services.
