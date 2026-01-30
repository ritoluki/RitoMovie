# RitoMovie - Copilot Instructions

## Project Overview

RitoMovie là một website xem phim streaming được xây dựng với:
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript + MongoDB
- **State Management**: Zustand + React Query

## 🎯 Current Priority: Admin Panel Development

### Task Tracking System

Dự án sử dụng hệ thống task tracking trong các files:
- `ADMIN_PANEL_PLAN.md` - Chi tiết kỹ thuật và specifications
- `ADMIN_TASKS.md` - Danh sách tasks với checkboxes để theo dõi

### Cách Thực Hiện Tasks

1. **Xác định task cần làm** từ `ADMIN_TASKS.md`
2. **Đọc specifications** trong `ADMIN_PANEL_PLAN.md`
3. **Kiểm tra dependencies** - hoàn thành các task phụ thuộc trước
4. **Implement theo best practices** của project
5. **Test code** trước khi commit
6. **Update checkbox** trong `ADMIN_TASKS.md`
7. **Commit** với message format: `feat(admin): description [TASK-XXX]`

## Code Style Guidelines

### TypeScript
- Sử dụng strict mode
- Tránh `any` type - sử dụng proper interfaces
- Export types/interfaces cùng với implementation

### Backend
- Controllers: Thin controllers, business logic trong services
- Error handling: Sử dụng asyncHandler và ApiError
- Validation: express-validator (đã có trong project) cho input validation
- Follow existing patterns trong `backend/src/controllers/`

### Frontend
- Components: Functional components với TypeScript
- Hooks: Custom hooks cho reusable logic
- Styling: TailwindCSS classes
- State: Zustand cho global state, React Query cho server state
- Follow existing patterns trong `frontend/src/components/`

## Directory Structure

### Backend Admin Files
```
backend/src/
├── controllers/admin/    # Admin controllers
├── middleware/           # adminAuth.ts goes here
├── models/               # AuditLog, SystemSetting, Report
├── routes/               # admin.ts route file
└── services/admin/       # Business logic
```

### Frontend Admin Files
```
frontend/src/admin/
├── components/
│   ├── layout/          # AdminLayout, Sidebar, Header
│   └── common/          # DataTable, StatCard, etc.
├── pages/               # Admin pages
├── services/            # adminService.ts
├── store/               # adminStore.ts
├── hooks/               # Custom hooks
├── types/               # TypeScript types
└── routes/              # AdminRoutes.tsx
```

## Testing

- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library
- E2E: Playwright (optional)

## Common Patterns

### Backend Controller Example
```typescript
import asyncHandler from '../../utils/asyncHandler';
import ApiError from '../../utils/ApiError';

export const getUsers = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20, search, role } = req.query;
  
  // Build query
  const query: any = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  if (role) query.role = role;

  const users = await User.find(query)
    .skip((+page - 1) * +limit)
    .limit(+limit)
    .sort('-createdAt');

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    data: users,
    pagination: {
      page: +page,
      limit: +limit,
      total,
      pages: Math.ceil(total / +limit)
    }
  });
});
```

### Frontend Service Example
```typescript
// Import existing axios instance - đã có sẵn trong project
import api from '@/lib/axios';

// Axios instance đã được config sẵn với:
// - baseURL: API_BASE_URL từ constants
// - Token handling từ localStorage/sessionStorage
// - Error interceptors
// - Accept-Language header cho i18n

export const adminService = {
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  
  // Users
  getUsers: (params: UserQueryParams) => 
    api.get('/admin/users', { params }),
  
  updateUser: (id: string, data: Partial<User>) => 
    api.put(`/admin/users/${id}`, data),
};
```

### Frontend Component Example
```tsx
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/adminService';

const AdminDashboard: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: () => adminService.getDashboardStats(),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      {/* Content */}
    </div>
  );
};
```

## Commit Message Format

```
feat(admin): add user management controller [TASK-007]
fix(admin): correct pagination logic in getUsers
refactor(admin): extract common table logic to hook
test(admin): add unit tests for AuditLog model
docs(admin): update task progress in ADMIN_TASKS.md
```

## Important Notes

1. **Security First**: Admin routes phải có authorization checks
2. **Audit Logging**: Mọi admin action phải được log
3. **Input Validation**: Validate tất cả user inputs
4. **Error Handling**: Proper error responses với meaningful messages
5. **Performance**: Sử dụng pagination, indexes, caching khi cần

## Quick Reference

| Need | Look At |
|------|---------|
| Task list | `ADMIN_TASKS.md` |
| Technical specs | `ADMIN_PANEL_PLAN.md` |
| Existing patterns | `backend/src/controllers/`, `frontend/src/components/` |
| Types | `frontend/src/types/index.ts` |
| API structure | `backend/src/routes/` |
