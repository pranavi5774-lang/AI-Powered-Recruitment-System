# Backend Architecture — HireSphere AI
**Lead Developer:** Sakshi Sable (PRN: SCFU224029)  
**Specialization:** Backend + Database + Authentication  
**Runtime:** Node.js • Next.js API Route Handlers • Jose JWT • Bcrypt • Zod  

---

## 📁 Directory Structure
```
Backend/
├── api/                     # 49 REST Route Handlers
│   ├── auth/                # Login, Register, Logout, Me, Password Reset
│   ├── ai/                  # AI Analysis trigger & retrieval endpoints
│   ├── applications/        # Application lifecycle (CRUD, Status, Notes, Withdraw)
│   ├── attendance/          # Clock-in/out, Daily History, Monthly Summary
│   ├── audit-logs/          # Immutable system activity tracking
│   ├── candidate/           # Candidate profile management
│   ├── dashboard/           # Aggregated statistics & analytics per role
│   ├── departments/         # Department management
│   ├── employees/           # Employee lifecycle, directory & updates
│   ├── health/              # Server health check endpoint
│   ├── jobs/                # Job requisitions CRUD, skills & criteria
│   ├── leaves/              # Leave requests, balance tracking & approval
│   ├── notifications/       # User alert stream & read status
│   ├── performance/         # Employee appraisal & performance scores
│   ├── reports/             # Exportable HR analytics
│   ├── resumes/             # Secure resume upload & private disk retrieval
│   ├── settings/            # System preferences
│   └── users/               # User administration & role changes
├── security/                # Jose JWT, Bcrypt password hashing & RBAC
└── services/                # Datetime calculations, JSON serialization, storage
```

## 🚀 Key Responsibilities Implemented
1. **Robust Security Gateway:** Stateless Jose JWT verification with httpOnly cookie storage, Bcrypt salt generation, and strict RBAC authorization.
2. **Comprehensive REST APIs:** 49 structured route handlers with status codes, error wrapping, and rate limiting.
3. **Atomic Operations:** Guarantees data consistency across multi-table operations using Prisma `$transaction`.
