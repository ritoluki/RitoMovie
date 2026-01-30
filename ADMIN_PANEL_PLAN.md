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
import AuditLog from '../models/AuditLog';

// Levels of admin access
export enum AdminRole {
  SUPER_ADMIN = 'super_admin',    // Full access
  ADMIN = 'admin',                 // Standard admin
  MODERATOR = 'moderator',         // Content moderation only
  ANALYST = 'analyst'              // View-only analytics
}

// All valid admin roles for validation
const VALID_ADMIN_ROLES = Object.values(AdminRole);

export const requireAdmin = (allowedRoles: AdminRole[] = [AdminRole.SUPER_ADMIN, AdminRole.ADMIN]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    if (!req.user) {
      // Log unauthorized access attempt
      await AuditLog.create({
        action: 'UNAUTHORIZED_ACCESS',
        resource: 'ADMIN_PANEL',
        details: { 
          message: 'Access attempt without authentication',
          path: req.path 
        },
        ipAddress,
        userAgent
      });
      
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required. Please login to access admin panel.' 
      });
    }
    
    // Validate that user role is a valid AdminRole
    if (!VALID_ADMIN_ROLES.includes(req.user.role as AdminRole)) {
      await AuditLog.create({
        admin: req.user._id,
        action: 'INSUFFICIENT_PERMISSIONS',
        resource: 'ADMIN_PANEL',
        details: { 
          message: `Invalid role: ${req.user.role}`,
          requiredRoles: allowedRoles,
          path: req.path 
        },
        ipAddress,
        userAgent
      });
      
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Your role '${req.user.role}' is not authorized. Required roles: ${allowedRoles.join(', ')}`
      });
    }
    
    if (!allowedRoles.includes(req.user.role as AdminRole)) {
      await AuditLog.create({
        admin: req.user._id,
        action: 'INSUFFICIENT_PERMISSIONS',
        resource: 'ADMIN_PANEL',
        details: { 
          message: `Role ${req.user.role} attempted to access restricted resource`,
          requiredRoles: allowedRoles,
          path: req.path 
        },
        ipAddress,
        userAgent
      });
      
      return res.status(403).json({ 
        success: false, 
        message: `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`
      });
    }
    
    next();
  };
};
```

#### 🔑 Admin User Bootstrapping

Để tạo Super Admin đầu tiên, sử dụng một trong các phương pháp sau:

**1. Qua Environment Variable (Recommended for production)**
```bash
# .env
ADMIN_BOOTSTRAP_EMAIL=admin@ritomovie.live
ADMIN_BOOTSTRAP_PASSWORD=SecurePassword123!
```

```typescript
// File: backend/src/scripts/bootstrapAdmin.ts
const bootstrapAdmin = async () => {
  const adminExists = await User.findOne({ role: 'super_admin' });
  if (!adminExists && process.env.ADMIN_BOOTSTRAP_EMAIL) {
    await User.create({
      email: process.env.ADMIN_BOOTSTRAP_EMAIL,
      password: process.env.ADMIN_BOOTSTRAP_PASSWORD,
      name: 'Super Admin',
      role: 'super_admin'
    });
    console.log('Super Admin created successfully');
  }
};
```

**2. Qua CLI Command**
```bash
npm run admin:create -- --email admin@example.com --password SecurePass123
```

**3. Qua API (chỉ khi chưa có admin nào)**
```typescript
// POST /api/admin/bootstrap - Chỉ hoạt động khi chưa có super_admin
```

#### 📊 New Models Required

**1. AuditLog Model** - Tracking all admin actions (including security events)

```typescript
// File: backend/src/models/AuditLog.ts
import mongoose, { Document, Schema } from 'mongoose';

// Define specific detail types for type safety
interface AuditDetails {
  message?: string;
  path?: string;
  requiredRoles?: string[];
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  reason?: string;
  targetEmail?: string;
}

interface IAuditLog extends Document {
  admin?: mongoose.Types.ObjectId;  // Optional for unauthenticated events
  action: 
    | 'CREATE' | 'UPDATE' | 'DELETE' 
    | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED'
    | 'UNAUTHORIZED_ACCESS' | 'INSUFFICIENT_PERMISSIONS'
    | 'SETTINGS_CHANGE' | 'PASSWORD_RESET' | 'ROLE_CHANGE'
    | 'BAN_USER' | 'UNBAN_USER';
  resource: 'USER' | 'MOVIE' | 'COMMENT' | 'RATING' | 'SETTINGS' | 'ADMIN_PANEL';
  resourceId?: string;
  details: AuditDetails;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema({
  admin: { type: Schema.Types.ObjectId, ref: 'User', sparse: true },
  action: { type: String, required: true, enum: [
    'CREATE', 'UPDATE', 'DELETE', 
    'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
    'UNAUTHORIZED_ACCESS', 'INSUFFICIENT_PERMISSIONS',
    'SETTINGS_CHANGE', 'PASSWORD_RESET', 'ROLE_CHANGE',
    'BAN_USER', 'UNBAN_USER'
  ]},
  resource: { type: String, required: true, enum: ['USER', 'MOVIE', 'COMMENT', 'RATING', 'SETTINGS', 'ADMIN_PANEL'] },
  resourceId: { type: String },
  details: { type: Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, required: true },
  userAgent: { type: String, required: true },
}, { timestamps: true });

// Database indexes for query performance
AuditLogSchema.index({ admin: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 }); // For chronological queries

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
```

**2. SystemSetting Model** - Site configuration

```typescript
// File: backend/src/models/SystemSetting.ts
import mongoose, { Document, Schema } from 'mongoose';

// Type-safe value using generics
type SettingValue = string | number | boolean | Record<string, unknown>;

interface ISystemSetting extends Document {
  key: string;
  value: SettingValue;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: 'general' | 'appearance' | 'email' | 'seo' | 'security';
  description: string;
  isSecret?: boolean; // Ẩn giá trị trong logs (passwords, API keys)
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const SystemSettingSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
  type: { type: String, required: true, enum: ['string', 'number', 'boolean', 'json'] },
  category: { type: String, required: true, enum: ['general', 'appearance', 'email', 'seo', 'security'] },
  description: { type: String, required: true },
  isSecret: { type: Boolean, default: false },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Index for category-based queries
SystemSettingSchema.index({ category: 1 });

export default mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
```

**3. Report Model** - User reports & flags

```typescript
// File: backend/src/models/Report.ts
import mongoose, { Document, Schema } from 'mongoose';

interface IReport extends Document {
  reporter: mongoose.Types.ObjectId;
  type: 'COMMENT' | 'USER' | 'MOVIE' | 'BUG';
  targetId: mongoose.Types.ObjectId | string; // ObjectId for COMMENT/USER/MOVIE, string for BUG
  targetModel?: 'Comment' | 'User' | 'Movie'; // Giúp populate dynamic reference
  reason: 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'SPOILER' | 'COPYRIGHT' | 'BUG_REPORT' | 'OTHER';
  description: string;
  status: 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'REJECTED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reviewedBy?: mongoose.Types.ObjectId;
  resolution?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema({
  reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true, enum: ['COMMENT', 'USER', 'MOVIE', 'BUG'] },
  targetId: { type: Schema.Types.Mixed, required: true },
  targetModel: { type: String, enum: ['Comment', 'User', 'Movie'] },
  reason: { 
    type: String, 
    required: true, 
    enum: ['SPAM', 'HARASSMENT', 'INAPPROPRIATE', 'SPOILER', 'COPYRIGHT', 'BUG_REPORT', 'OTHER'] 
  },
  description: { type: String, required: true, maxlength: 1000 },
  status: { type: String, required: true, enum: ['PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED'], default: 'PENDING' },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  resolution: { type: String, maxlength: 500 },
  resolvedAt: { type: Date }
}, { timestamps: true });

// Indexes for report management
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ type: 1, status: 1 });
ReportSchema.index({ priority: 1, status: 1 });
ReportSchema.index({ reporter: 1, createdAt: -1 });

// Validation middleware to ensure targetModel matches type
ReportSchema.pre('save', function(next) {
  if (this.type === 'BUG') {
    this.targetModel = undefined;
  } else {
    this.targetModel = this.type === 'COMMENT' ? 'Comment' : 
                       this.type === 'USER' ? 'User' : 'Movie';
  }
  next();
});

export default mongoose.model<IReport>('Report', ReportSchema);
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

# Report Management - Clear action-based endpoints
GET    /api/admin/reports                 - List reports (with filters: type, status, priority)
GET    /api/admin/reports/:id             - Get report details
PUT    /api/admin/reports/:id/status      - Update report status (REVIEWING, RESOLVED, REJECTED)
PUT    /api/admin/reports/:id/priority    - Update report priority
POST   /api/admin/reports/:id/resolve     - Resolve report with action taken
POST   /api/admin/reports/:id/reject      - Reject report with reason

# Moderation Rules
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

#### Testing Frameworks & Tools:
- **Backend Testing**:
  - **Jest**: Unit testing framework
  - **Supertest**: HTTP integration testing
  - **MongoDB Memory Server**: Database testing in isolation
  
- **Frontend Testing**:
  - **Jest + React Testing Library**: Component testing
  - **MSW (Mock Service Worker)**: API mocking
  - **Playwright/Cypress**: E2E testing

#### Test Coverage Requirements:
- **Controllers**: Minimum 80% coverage
- **Services**: Minimum 90% coverage
- **Utilities**: Minimum 95% coverage
- **Critical Paths**: 100% coverage (auth, payments)

#### Test Categories:
- **Unit Tests**: Controllers, services, utilities
- **Integration Tests**: API endpoints với database thực
- **E2E Tests**: Critical user flows (login, CRUD operations)
- **Security Testing**: Authentication, authorization, input validation

### 5.2 Performance Optimization

- **API Optimization**:
  - Database indexes (đã định nghĩa trong models)
  - Query optimization với aggregation pipelines
  - Caching với **Redis** (recommended cho production với multiple instances)
  - Lưu ý: `node-cache` chỉ phù hợp cho single-instance development
- **Frontend Optimization**:
  - Code splitting theo routes
  - Lazy loading components
  - Image optimization với WebP
  - Memoization với React.memo và useMemo

### 5.3 Security Hardening

- Rate limiting trên admin routes (sử dụng `rate-limiter-flexible`)
- CSRF protection với `csurf` middleware
- Input sanitization với `express-validator` và `sanitize-html`
- **NoSQL Injection prevention**:
  - Sử dụng Mongoose schema validation
  - Tránh string concatenation trong queries
  - Sử dụng đúng MongoDB query operators
  - Sanitize user inputs trước khi query
- XSS protection với `helmet` và content security policy
- Session management với secure cookies và token rotation

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
  "pdfkit": "PDF report generation",
  "exceljs": "Excel export",
  "redis": "Production caching (multi-instance support)",
  "ioredis": "Redis client cho Node.js",
  "winston": "Advanced logging",
  "rate-limiter-flexible": "Rate limiting",
  "csurf": "CSRF protection",
  "sanitize-html": "HTML sanitization"
}
```

### New Dependencies - Frontend:
```json
{
  "recharts": "Charts library (React-optimized)",
  "chart.js": "Alternative charting library",
  "react-chartjs-2": "React wrapper for Chart.js",
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
