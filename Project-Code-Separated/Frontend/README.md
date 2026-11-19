# Frontend Architecture — HireSphere AI
**Lead Developer:** Vijayalaxmi Mhetri (PRN: SCFU224007)  
**Specialization:** Frontend + UI + API Integration  
**Framework:** Next.js 15 (Client SPA) • React 19 • Tailwind CSS • Radix UI • Zustand  

---

## 📁 Directory Structure
```
Frontend/
├── components/
│   ├── spa/                 # Domain Feature Pages (Single Page Application)
│   │   ├── admin/           # System Administration & Audit Logs
│   │   ├── auth/            # Multi-Role Login, Register, Forgot/Reset Password
│   │   ├── candidate/       # Job Search, Application Status, Profile
│   │   ├── employee/        # Profile, Attendance Clock-In, Leave Requests
│   │   ├── hr/              # Job Postings, Candidate Screening, Ranking Table
│   │   ├── landing/         # Modern Landing Page & 3D Interactive Hero Canvas
│   │   ├── layout/          # Top Navbar, Sidebar & Role-Based Navigation
│   │   └── shared/          # Reusable Modals, Status Badges, Data Tables
│   ├── ui/                  # 48 Modular UI Components (Buttons, Dialogs, Cards)
│   └── theme-provider.tsx   # Dark/Light Theme Provider
├── hooks/                   # Custom React Hooks (useToast, useMobile)
├── state/                   # Zustand Client State Store (store.ts)
├── routing/                 # Client-Side Hash Router (router.ts - zero reloads)
├── services/                # API Client Services (api-client.ts, api.ts)
├── pages/                   # Next.js Shell Pages (page.tsx, layout.tsx, globals.css)
├── config/                  # Tailwind, PostCSS & Components Configs
└── public/                  # Static Assets, SVG Icons & Logos
```

## 🚀 Key Responsibilities Implemented
1. **Responsive SPA Architecture:** Instant navigation between candidate, HR, employee, and admin roles using zero-reload hash routing (`#/hr/jobs`).
2. **Interactive HR Candidate Screening:** Dynamic score sort, filter chips by department/skill, and 1-click modal for applicant review.
3. **Client-Side State:** Centralized Zustand store handling active user session, token persistence, and optimistic UI updates.
