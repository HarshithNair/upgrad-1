# upGrad Enrollment Registration Management System

A professional, production-ready full-stack web application built using **Next.js 15 (App Router)** and **TypeScript** with a custom-designed **Red & White upGrad theme**. It supports user registration, duplicate verification, session-based admin authentication, an analytics/management dashboard, data filtering/sorting, spreadsheet export, and optional real-time Google Sheets sync.

---

## 🚀 Features

### 👤 Public Enrollment Portal
- **Welcome Banner**: Welcoming header tailored with upGrad's theme and clear instructions.
- **Responsive Form**: Seamless registration on Desktop, Tablet, and Mobile viewports.
- **Fields Collected**: Full Name, Email, Phone Number, Location/City.
- **Client-Side Validation**: Real-time validation of email formats, phone digit counts (10–15 digits), and required fields.
- **Server-Side Validation**: Multi-layer security validation checking fields, matching duplicate registrations (unique email/phone checking), and returning clean user-facing error messages.
- **Animated Success Modal**: Professional animated modal with custom checkmark, confirmation details, and auto-dismiss.

### 🔑 Security & Administration
- **Admin Authentication**: Safe login page (`/login`) secured using httpOnly, secure, and sameSite-lax cookies.
- **Configurable Password**: Admin password set via environment variables.

### 📊 Management Dashboard (`/admin`)
- **Key Metrics Overview**: Cards showcasing Total Registrations, Today's Registrations, and Top Cities.
- **Data Table**:
  - Full search across Name, Email, Phone, and Location.
  - Quick dropdown filtering by location.
  - Column sorting by full name, email, phone, location, and registration date.
  - Pagination for performance.
- **Excel/CSV Export**: Simple download buttons for sheet exports generated using SheetJS (`xlsx`) or native streams.
- **Auto-Refresh**: Live dashboard stats and registration counters updating every 30 seconds.

---

## 🛠️ Tech Stack
- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Styling**: Modern, responsive **Vanilla CSS** (No Tailwind) using custom properties for standard styles and spacing tokens.
- **Database**: **SQLite** (using `better-sqlite3` with lazy initialization and WAL mode to prevent concurrency locks).
- **Libraries**: `xlsx` (SheetJS) for exports, `googleapis` for Google Sheets sync.

---

## ⚙️ Configuration & Environment Variables

Copy or create a `.env.local` file in the root directory:

```env
# Admin Dashboard Password
ADMIN_PASSWORD=your-admin-password-here

# Google Sheets Integration (Optional - Syncs registrations in real-time)
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_SHEET_ID=your-spreadsheet-id
```

*Note: Google Sheets sync is optional. If the environment variables are not supplied or left commented, the app will continue to run with SQLite.*

---

## 💻 Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.
- Public Form: `/`
- Admin Login: `/login`
- Admin Dashboard: `/admin`

### 3. Linting Checks
```bash
npm run lint
```

### 4. Build for Production
```bash
npm run build
npm run start
```
