# 🎬 RitoMovie - Admin Panel Development Plan

> **Author**: Senior Software Architect (10+ Years Experience)  
> **Date**: January 2026  
> **Project**: RitoMovie Admin Dashboard

---

## 📊 Executive Summary

Sau khi phân tích kỹ lưỡng codebase của RitoMovie, tôi đề xuất một **Admin Panel hoàn chỉnh** được thiết kế theo kiến trúc **module-based**, đảm bảo khả năng mở rộng (scalability), bảo trì (maintainability), và trải nghiệm người dùng tốt nhất.

---

## 🏗️ PHASE 1: FOUNDATION (Week 1-2)

### 1.1 Backend - Admin Infrastructure

#### 📁 Cấu trúc mới cần tạo

```
backend/src/
├── controllers/
│   └── admin/
│       ├── adminDashboardController.ts
│       ├── adminUserController.ts
│       ├── adminMovieController.ts
│       ├── adminCommentController.ts
│       ├── adminAnalyticsController.ts
│       └── adminSettingsController.ts
├── routes/
│   └── admin.ts
├── middleware/
│   └── adminAuth.ts (extend existing auth.ts)
├── models/
│   ├── AuditLog.ts
│   ├── SystemSetting.ts
│   └── Report.ts
└── services/
    └── admin/
        ├── dashboardService.ts
        ├── analyticsService.ts
        └── reportService.ts
```

#### 🔐 Enhanced Authorization Middleware

```typescript
// File: backend/src/middleware/adminAuth.ts

import { Request, Response, NextFunction } from 'express';

// Levels of admin access
export enum AdminRole {
  SUPER_ADMIN = 'super_admin',    // Full access
  ADMIN = 'admin',                 // Standard admin
  MODERATOR = 'moderator',         // Content moderation only
  ANALYST = 'analyst'              // View-only analytics
}

export const requireAdmin = (allowedRoles: AdminRole[] = [AdminRole.SUPER_ADMIN, AdminRole.ADMIN]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }
    
    next();
  };
};
```

#### 📊 New Models Required

**1. AuditLog Model** - Tracking all admin actions

```typescript
// File: backend/src/models/AuditLog.ts
interface IAuditLog {
  admin: ObjectId;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'SETTINGS_CHANGE';
  resource: 'USER' | 'MOVIE' | 'COMMENT' | 'RATING' | 'SETTINGS';
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}
```

**2. SystemSetting Model** - Site configuration

```typescript
// File: backend/src/models/SystemSetting.ts
interface ISystemSetting {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: 'general' | 'appearance' | 'email' | 'seo' | 'security';
  description: string;
  updatedBy: ObjectId;
  updatedAt: Date;
}
```

**3. Report Model** - User reports & flags

```typescript
// File: backend/src/models/Report.ts
interface IReport {
  reporter: ObjectId;
  type: 'COMMENT' | 'USER' | 'MOVIE' | 'BUG';
  targetId: string;
  reason: string;
  description: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'REJECTED';
  reviewedBy?: ObjectId;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 1.2 Frontend - Admin Module Setup

#### 📁 Cấu trúc Admin Frontend

```
frontend/src/
├── admin/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── AdminHeader.tsx
│   │   │   └── AdminBreadcrumb.tsx
│   │   ├── common/
│   │   │   ├── DataTable.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── ChartWrapper.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── SearchInput.tsx
│   │   │   └── ActionDropdown.tsx
│   │   ├── dashboard/
│   │   │   ├── OverviewStats.tsx
│   │   │   ├── RecentActivity.tsx
│   │   │   ├── UserChart.tsx
│   │   │   └── QuickActions.tsx
│   │   ├── users/
│   │   │   ├── UserTable.tsx
│   │   │   ├── UserForm.tsx
│   │   │   ├── UserDetails.tsx
│   │   │   └── RoleManager.tsx
│   │   ├── movies/
│   │   │   ├── MovieTable.tsx
│   │   │   ├── MovieForm.tsx
│   │   │   ├── GenreManager.tsx
│   │   │   └── BulkActions.tsx
│   │   ├── comments/
│   │   │   ├── CommentTable.tsx
│   │   │   ├── CommentModeration.tsx
│   │   │   └── ReportQueue.tsx
│   │   └── settings/
│   │       ├── GeneralSettings.tsx
│   │       ├── SEOSettings.tsx
│   │       ├── EmailSettings.tsx
│   │       └── SecuritySettings.tsx
│   ├── pages/
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminUsers.tsx
│   │   ├── AdminMovies.tsx
│   │   ├── AdminComments.tsx
│   │   ├── AdminReports.tsx
│   │   ├── AdminAnalytics.tsx
│   │   ├── AdminSettings.tsx
│   │   └── AdminAuditLog.tsx
│   ├── hooks/
│   │   ├── useAdminAuth.ts
│   │   ├── useAdminData.ts
│   │   └── useAdminActions.ts
│   ├── services/
│   │   └── adminService.ts
│   ├── store/
│   │   └── adminStore.ts
│   ├── types/
│   │   └── admin.ts
│   └── routes/
│       └── AdminRoutes.tsx
```

---

## 📱 PHASE 2: CORE MODULES (Week 3-5)

### 2.1 Dashboard Module

#### Features:
- **Overview Statistics**: Tổng số users, movies, comments, ratings
- **Real-time Charts**: 
  - Biểu đồ tăng trưởng người dùng (daily/weekly/monthly)
  - Biểu đồ lượt xem phim
  - Top trending movies
- **Recent Activity Feed**: 
  - New registrations
  - New comments
  - New ratings
- **Quick Actions**: 
  - Add new movie
  - View reports
  - Access settings

#### API Endpoints:
```
GET /api/admin/dashboard/stats       - Overview statistics
GET /api/admin/dashboard/charts      - Chart data
GET /api/admin/dashboard/activity    - Recent activity
GET /api/admin/dashboard/alerts      - System alerts
```

### 2.2 User Management Module

#### Features:
- **User List**: Paginated table with search, filter, sort
- **User Actions**:
  - View user details
  - Edit user info
  - Change user role
  - Ban/Suspend user
  - Delete user
  - Send notification
- **Bulk Actions**:
  - Mass ban
  - Mass delete
  - Export to CSV
- **User Activity**:
  - Watch history
  - Ratings
  - Comments
  - Login history

#### API Endpoints:
```
GET    /api/admin/users              - List users (paginated)
GET    /api/admin/users/:id          - User details
PUT    /api/admin/users/:id          - Update user
PUT    /api/admin/users/:id/role     - Change role
PUT    /api/admin/users/:id/ban      - Ban user
DELETE /api/admin/users/:id          - Delete user
POST   /api/admin/users/bulk-action  - Bulk operations
GET    /api/admin/users/:id/activity - User activity
```

### 2.3 Movie Management Module

#### Features:
- **Movie List**: 
  - Search by title, genre, year
  - Filter by status, quality
  - Sort by various fields
- **Movie Actions**:
  - Add new movie (from TMDB or manual)
  - Edit movie details
  - Upload/change poster/backdrop
  - Manage video sources
  - Set featured/trending
  - Delete movie
- **Genre Management**: CRUD for genres
- **Import Tools**:
  - Bulk import from TMDB
  - CSV import
  - API sync

#### API Endpoints:
```
GET    /api/admin/movies                - List movies
POST   /api/admin/movies                - Create movie
GET    /api/admin/movies/:id            - Movie details
PUT    /api/admin/movies/:id            - Update movie
DELETE /api/admin/movies/:id            - Delete movie
POST   /api/admin/movies/:id/feature    - Set featured
POST   /api/admin/movies/import-tmdb    - Import from TMDB
GET    /api/admin/genres                - List genres
POST   /api/admin/genres                - Create genre
PUT    /api/admin/genres/:id            - Update genre
DELETE /api/admin/genres/:id            - Delete genre
```

### 2.4 Comment & Report Moderation Module

#### Features:
- **Comment Moderation Queue**:
  - View all comments
  - Filter by status (pending, approved, rejected)
  - Mark as spoiler
  - Delete comment
  - Reply as admin
- **Report Management**:
  - View all reports
  - Filter by type, status
  - Review and resolve reports
  - Take action on reported content
- **Auto-moderation Rules**:
  - Keyword blacklist
  - Spam detection settings
  - Auto-hide settings

#### API Endpoints:
```
GET    /api/admin/comments           - List all comments
PUT    /api/admin/comments/:id       - Update comment status
DELETE /api/admin/comments/:id       - Delete comment
GET    /api/admin/reports            - List reports
PUT    /api/admin/reports/:id        - Review report
POST   /api/admin/reports/:id/action - Take action on report
GET    /api/admin/moderation/rules   - Get moderation rules
PUT    /api/admin/moderation/rules   - Update moderation rules
```

---

## 📈 PHASE 3: ANALYTICS & ADVANCED FEATURES (Week 6-7)

### 3.1 Analytics Module

#### Features:
- **Traffic Analytics**:
  - Page views
  - Unique visitors
  - Session duration
  - Bounce rate
- **User Analytics**:
  - New vs returning users
  - User retention
  - Geographic distribution
  - Device/browser stats
- **Content Analytics**:
  - Most viewed movies
  - Top rated movies
  - Most commented movies
  - Search trends
- **Export & Reports**:
  - Generate PDF reports
  - Export to Excel
  - Scheduled reports

#### API Endpoints:
```
GET /api/admin/analytics/traffic     - Traffic data
GET /api/admin/analytics/users       - User analytics
GET /api/admin/analytics/content     - Content analytics
GET /api/admin/analytics/search      - Search trends
POST /api/admin/analytics/export     - Export report
```

### 3.2 Settings Module

#### Categories:
- **General Settings**:
  - Site name, logo, favicon
  - Contact info
  - Social links
  - Maintenance mode
- **SEO Settings**:
  - Meta titles, descriptions
  - Open Graph settings
  - Sitemap generation
  - Robots.txt
- **Email Settings**:
  - SMTP configuration
  - Email templates
  - Notification preferences
- **Security Settings**:
  - Session timeout
  - Password policies
  - IP whitelist/blacklist
  - 2FA settings
- **API Settings**:
  - TMDB API key
  - Rate limiting
  - Cache settings

#### API Endpoints:
```
GET    /api/admin/settings           - Get all settings
GET    /api/admin/settings/:category - Get category settings
PUT    /api/admin/settings           - Update settings
POST   /api/admin/settings/test-email - Test email
```

### 3.3 Audit Log Module

#### Features:
- **Activity Tracking**:
  - All admin actions logged
  - Filter by admin, action, date
  - Search by details
- **Export Options**:
  - Export to CSV/PDF
  - Date range selection

#### API Endpoints:
```
GET /api/admin/audit-logs            - List audit logs
GET /api/admin/audit-logs/export     - Export logs
```

---

## 🎨 PHASE 4: UI/UX DESIGN (Continuous)

### 4.1 Design System

#### Color Palette (Dark Theme - Netflix Inspired):
```css
--admin-bg-primary: #141414;
--admin-bg-secondary: #1a1a1a;
--admin-bg-tertiary: #2a2a2a;
--admin-text-primary: #ffffff;
--admin-text-secondary: #b3b3b3;
--admin-accent-primary: #e50914;
--admin-accent-hover: #f40612;
--admin-success: #46d369;
--admin-warning: #ffa500;
--admin-danger: #ff4444;
--admin-info: #17a2b8;
```

#### Typography:
- **Headings**: Inter Bold
- **Body**: Inter Regular
- **Monospace**: JetBrains Mono (for code/IDs)

### 4.2 Component Library

#### Data Display:
- **DataTable**: Sortable, filterable, paginated tables
- **StatCard**: Statistics with trend indicators
- **Chart Components**: Line, Bar, Pie charts (using Chart.js or Recharts)

#### Forms:
- **Enhanced Inputs**: With validation, error states
- **Rich Text Editor**: For movie descriptions
- **Image Upload**: With preview, crop, resize
- **Select Components**: Searchable, multi-select

#### Feedback:
- **Toast Notifications**: Success, error, warning, info
- **Loading States**: Skeleton loaders, spinners
- **Empty States**: Friendly illustrations

#### Navigation:
- **Collapsible Sidebar**: With icon-only mode
- **Breadcrumbs**: For deep navigation
- **Search Modal**: Global search (Cmd+K)

---

## 📋 PHASE 5: TESTING & OPTIMIZATION (Week 8)

### 5.1 Testing Strategy

- **Unit Tests**: Controllers, services, utilities
- **Integration Tests**: API endpoints
- **E2E Tests**: Critical user flows
- **Security Testing**: Authentication, authorization

### 5.2 Performance Optimization

- **API Optimization**:
  - Database indexes
  - Query optimization
  - Caching (Redis recommended)
- **Frontend Optimization**:
  - Code splitting
  - Lazy loading
  - Image optimization
  - Memoization

### 5.3 Security Hardening

- Rate limiting on admin routes
- CSRF protection
- Input sanitization
- SQL injection prevention
- XSS protection
- Session management

---

## 🚀 IMPLEMENTATION ROADMAP

### Week 1-2: Foundation
- [ ] Setup admin route structure
- [ ] Create new models (AuditLog, SystemSetting, Report)
- [ ] Enhance authorization middleware
- [ ] Create AdminLayout and base components

### Week 3-4: Core Modules (Part 1)
- [ ] Dashboard with statistics
- [ ] User management CRUD
- [ ] Basic data tables

### Week 5: Core Modules (Part 2)
- [ ] Movie management
- [ ] Comment moderation
- [ ] Report handling

### Week 6-7: Advanced Features
- [ ] Analytics dashboard
- [ ] Settings management
- [ ] Audit logging

### Week 8: Polish & Deploy
- [ ] Testing
- [ ] Performance optimization
- [ ] Documentation
- [ ] Deployment

---

## 📊 PRIORITY MATRIX

| Feature | Priority | Complexity | Impact |
|---------|----------|------------|--------|
| Dashboard Stats | 🔴 High | Low | High |
| User Management | 🔴 High | Medium | High |
| Movie Management | 🔴 High | Medium | High |
| Comment Moderation | 🟡 Medium | Low | Medium |
| Reports | 🟡 Medium | Low | Medium |
| Analytics | 🟡 Medium | High | Medium |
| Settings | 🟢 Low | Medium | Low |
| Audit Logs | 🟢 Low | Low | Low |

---

## 💡 RECOMMENDATIONS

### Short-term (Must Have):
1. **User & Movie Management**: Core functionality for any admin panel
2. **Dashboard**: Quick overview of system health
3. **Comment Moderation**: Essential for content management

### Medium-term (Should Have):
1. **Analytics**: For data-driven decisions
2. **Settings Management**: Flexibility without code changes
3. **Bulk Actions**: Efficiency for large datasets

### Long-term (Nice to Have):
1. **Advanced Analytics**: Deeper insights
2. **Automated Moderation**: AI-powered content filtering
3. **Multi-language Support**: For international expansion
4. **Push Notifications**: Real-time admin alerts

---

## 🔧 TECHNOLOGY RECOMMENDATIONS

### New Dependencies - Backend:
```json
{
  "chart.js": "For analytics charts",
  "pdfkit": "PDF report generation",
  "exceljs": "Excel export",
  "node-cache": "In-memory caching",
  "winston": "Advanced logging",
  "rate-limiter-flexible": "Rate limiting"
}
```

### New Dependencies - Frontend:
```json
{
  "recharts": "Charts library",
  "@tanstack/react-table": "Advanced data tables",
  "react-quill": "Rich text editor",
  "react-dropzone": "File uploads",
  "@dnd-kit/core": "Drag and drop",
  "date-fns": "Date utilities"
}
```

---

## 📝 CONCLUSION

Đây là một plan toàn diện để xây dựng Admin Panel cho RitoMovie. Plan này được thiết kế theo nguyên tắc:

1. **Modularity**: Mỗi module độc lập, dễ maintain
2. **Scalability**: Có thể mở rộng thêm features
3. **Security First**: Authorization ở mọi level
4. **User Experience**: UI/UX clean, intuitive
5. **Performance**: Optimized cho large datasets

---

*Document Version: 1.0*  
*Last Updated: January 2026*
