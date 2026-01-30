# 🎯 RitoMovie Admin Panel - Task Tracker

> **Mục đích**: File này được thiết kế để AI agents có thể đọc và thực hiện từng task một cách có hệ thống.
> 
> **Cách sử dụng**: Mỗi khi hoàn thành một task, đánh dấu `[x]` và commit changes.

---

## 📋 HƯỚNG DẪN CHO AI AGENT

### Quy tắc khi làm việc:
1. **Đọc task description** trước khi bắt đầu
2. **Kiểm tra dependencies** - task nào cần hoàn thành trước
3. **Thực hiện đúng theo spec** trong `ADMIN_PANEL_PLAN.md`
4. **Test code** trước khi đánh dấu hoàn thành
5. **Commit thường xuyên** với message rõ ràng
6. **Update checkbox** khi hoàn thành

### Cách request AI thực hiện task:
```
Hãy thực hiện Task [TASK_ID] trong file ADMIN_TASKS.md
Tham khảo chi tiết trong ADMIN_PANEL_PLAN.md
```

---

## 🏗️ PHASE 1: FOUNDATION

### Backend Infrastructure

#### TASK-001: Tạo AuditLog Model
- **Status**: ✅ Completed
- **Priority**: 🔴 High
- **Dependencies**: None
- **File**: `backend/src/models/AuditLog.ts`
- **Description**: Tạo model để tracking tất cả admin actions
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 1 > AuditLog Model
- **Acceptance Criteria**:
  - [x] Schema với các fields: admin, action, resource, resourceId, details, ipAddress, userAgent
  - [x] Indexes cho query performance
  - [x] TypeScript interface đầy đủ
  - [x] Export default model

---

#### TASK-002: Tạo SystemSetting Model
- **Status**: ✅ Completed
- **Priority**: 🟡 Medium
- **Dependencies**: None
- **File**: `backend/src/models/SystemSetting.ts`
- **Description**: Tạo model để lưu site configuration
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 1 > SystemSetting Model
- **Acceptance Criteria**:
  - [x] Schema với key, value, type, category, description
  - [x] Index cho category-based queries
  - [x] Type-safe value handling

---

#### TASK-003: Tạo Report Model
- **Status**: ✅ Completed
- **Priority**: 🟡 Medium
- **Dependencies**: None
- **File**: `backend/src/models/Report.ts`
- **Description**: Tạo model để xử lý user reports & flags
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 1 > Report Model
- **Acceptance Criteria**:
  - [x] Schema đầy đủ với validation
  - [x] Pre-save middleware để set targetModel
  - [x] Indexes cho report management

---

#### TASK-004: Tạo Admin Authorization Middleware
- **Status**: ✅ Completed
- **Priority**: 🔴 High
- **Dependencies**: TASK-001
- **File**: `backend/src/middleware/adminAuth.ts`
- **Description**: Tạo middleware kiểm tra quyền admin với security logging
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 1 > Enhanced Authorization Middleware
- **Acceptance Criteria**:
  - [x] AdminRole enum (SUPER_ADMIN, ADMIN, MODERATOR, ANALYST)
  - [x] requireAdmin function với role validation
  - [x] Security event logging cho failed attempts
  - [x] Descriptive error messages

---

#### TASK-005: Tạo Admin Routes
- **Status**: ✅ Completed
- **Priority**: 🔴 High
- **Dependencies**: TASK-004
- **File**: `backend/src/routes/admin.ts`
- **Description**: Setup route structure cho admin API
- **Spec Reference**: ADMIN_PANEL_PLAN.md > All API Endpoints
- **Acceptance Criteria**:
  - [x] Route prefix /api/admin
  - [x] Apply protect và requireAdmin middleware
  - [x] Import từ các admin controllers
  - [x] Register trong server.ts

---

#### TASK-006: Tạo Admin Dashboard Controller
- **Status**: ✅ Completed
- **Priority**: 🔴 High
- **Dependencies**: TASK-005
- **File**: `backend/src/controllers/admin/adminDashboardController.ts`
- **Description**: Controller xử lý dashboard statistics
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 2 > Dashboard Module
- **Acceptance Criteria**:
  - [x] getStats - tổng số users, movies, comments, ratings
  - [x] getCharts - data cho biểu đồ
  - [x] getActivity - recent activity feed
  - [x] getAlerts - system alerts

---

#### TASK-007: Tạo Admin User Controller
- **Status**: ✅ Completed
- **Priority**: 🔴 High
- **Dependencies**: TASK-005
- **File**: `backend/src/controllers/admin/adminUserController.ts`
- **Description**: Controller quản lý users
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 2 > User Management
- **Acceptance Criteria**:
  - [x] listUsers - paginated với search, filter, sort
  - [x] getUserDetails - chi tiết user
  - [x] updateUser - cập nhật thông tin
  - [x] changeUserRole - thay đổi role
  - [x] banUser / unbanUser - ban/unban user
  - [x] deleteUser - xóa user
  - [x] bulkAction - xử lý hàng loạt

---

#### TASK-008: Tạo Admin Movie Controller
- **Status**: ✅ Completed
- **Priority**: 🔴 High
- **Dependencies**: TASK-005
- **File**: `backend/src/controllers/admin/adminMovieController.ts`
- **Description**: Controller quản lý movies
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 2 > Movie Management
- **Acceptance Criteria**:
  - [x] listMovies - paginated với filters
  - [x] createMovie - thêm phim mới
  - [x] updateMovie - cập nhật phim
  - [x] deleteMovie - xóa phim
  - [x] setFeatured - đặt phim nổi bật
  - [x] importFromTMDB - import từ TMDB

---

#### TASK-009: Tạo Admin Comment Controller
- **Status**: ✅ Completed
- **Priority**: 🟡 Medium
- **Dependencies**: TASK-005
- **File**: `backend/src/controllers/admin/adminCommentController.ts`
- **Description**: Controller quản lý comments và moderation
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 2 > Comment Moderation
- **Acceptance Criteria**:
  - [x] listComments - tất cả comments
  - [x] updateCommentStatus - approve/reject
  - [x] deleteComment - xóa comment
  - [x] getModerationRules - lấy rules
  - [x] updateModerationRules - cập nhật rules

---

#### TASK-010: Tạo Admin Report Controller
- **Status**: ✅ Completed
- **Priority**: 🟡 Medium
- **Dependencies**: TASK-003, TASK-005
- **File**: `backend/src/controllers/admin/adminReportController.ts`
- **Description**: Controller xử lý user reports
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 2 > Report Management
- **Acceptance Criteria**:
  - [x] listReports - danh sách reports
  - [x] getReportDetails - chi tiết report
  - [x] updateReportStatus - thay đổi status
  - [x] updateReportPriority - thay đổi priority
  - [x] resolveReport - giải quyết report
  - [x] rejectReport - từ chối report

---

### Frontend Infrastructure

#### TASK-011: Tạo Admin Layout Component
- **Status**: ✅ Completed
- **Priority**: 🔴 High
- **Dependencies**: None
- **Files**: 
  - `frontend/src/admin/components/layout/AdminLayout.tsx`
  - `frontend/src/admin/components/layout/AdminSidebar.tsx`
  - `frontend/src/admin/components/layout/AdminHeader.tsx`
- **Description**: Layout chính cho admin panel
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 1 > Frontend Structure
- **Acceptance Criteria**:
  - [x] Sidebar với navigation menu
  - [x] Header với user info, notifications
  - [x] Responsive design
  - [x] Dark theme theo design system

---

#### TASK-012: Tạo Admin Routes
- **Status**: ✅ Completed
- **Priority**: 🔴 High
- **Dependencies**: TASK-011
- **File**: `frontend/src/admin/routes/AdminRoutes.tsx`
- **Description**: Setup routing cho admin pages
- **Acceptance Criteria**:
  - [x] Route /admin với AdminLayout
  - [x] Lazy loading cho các pages
  - [x] Protected routes cho admin only
  - [x] Integrate vào main routes

---

#### TASK-013: Tạo Admin Service
- **Status**: ✅ Completed
- **Priority**: 🔴 High
- **Dependencies**: None (sử dụng existing axios config từ `frontend/src/lib/axios.ts`)
- **File**: `frontend/src/admin/services/adminService.ts`
- **Description**: API service cho admin endpoints
- **Note**: Tham khảo API endpoints trong ADMIN_PANEL_PLAN.md và TASK-005
- **Acceptance Criteria**:
  - [x] Dashboard API calls
  - [x] User management API calls
  - [x] Movie management API calls
  - [x] Comment/Report API calls
  - [x] Settings API calls

---

#### TASK-014: Tạo Admin Store (Zustand)
- **Status**: ⬜ Not Started
- **Priority**: 🟡 Medium
- **Dependencies**: TASK-013
- **File**: `frontend/src/admin/store/adminStore.ts`
- **Description**: State management cho admin panel
- **Acceptance Criteria**:
  - [ ] Dashboard state
  - [ ] Selected items state
  - [ ] Filter/sort state
  - [ ] Actions và selectors

---

#### TASK-015: Tạo Admin Dashboard Page
- **Status**: ✅ Completed
- **Priority**: 🔴 High
- **Dependencies**: TASK-011, TASK-012, TASK-013, TASK-022, TASK-023
- **File**: `frontend/src/admin/pages/AdminDashboard.tsx`
- **Description**: Trang dashboard chính
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 2 > Dashboard Module
- **Acceptance Criteria**:
  - [x] StatCards cho overview statistics (cần TASK-022)
  - [x] Charts (line, bar, pie) (cần TASK-023)
  - [x] Recent activity feed
  - [x] Quick actions

---

#### TASK-016: Tạo Admin Users Page
- **Status**: ✅ Completed
- **Priority**: 🔴 High
- **Dependencies**: TASK-011, TASK-012, TASK-013, TASK-021, TASK-024
- **File**: `frontend/src/admin/pages/AdminUsers.tsx`
- **Description**: Trang quản lý users
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 2 > User Management
- **Acceptance Criteria**:
  - [x] DataTable với pagination
  - [x] Search và filter
  - [x] User actions (edit, ban, delete)
  - [x] Bulk actions
  - [x] User detail modal

---

#### TASK-017: Tạo Admin Movies Page
- **Status**: ✅ Completed
- **Priority**: 🔴 High
- **Dependencies**: TASK-011, TASK-012, TASK-013, TASK-021, TASK-024
- **File**: `frontend/src/admin/pages/AdminMovies.tsx`
- **Description**: Trang quản lý movies
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 2 > Movie Management
- **Acceptance Criteria**:
  - [x] DataTable với pagination (cần TASK-021)
  - [x] Search và filter
  - [x] Add/Edit movie form
  - [x] TMDB import functionality
  - [x] Bulk actions

---

#### TASK-018: Tạo Admin Comments Page
- **Status**: ✅ Completed
- **Priority**: 🟡 Medium
- **Dependencies**: TASK-011, TASK-012, TASK-013, TASK-021
- **File**: `frontend/src/admin/pages/AdminComments.tsx`
- **Description**: Trang moderation comments
- **Acceptance Criteria**:
  - [x] Comment list với filters (cần TASK-021)
  - [x] Approve/Reject actions
  - [x] Delete comment
  - [x] View in context

---

#### TASK-019: Tạo Admin Reports Page
- **Status**: ✅ Completed
- **Priority**: 🟡 Medium
- **Dependencies**: TASK-011, TASK-012, TASK-013, TASK-021
- **File**: `frontend/src/admin/pages/AdminReports.tsx`
- **Description**: Trang xử lý reports
- **Acceptance Criteria**:
  - [x] Report queue (cần TASK-021)
  - [x] Filter by type, status, priority
  - [x] Review và resolve workflow
  - [x] Action buttons

---

#### TASK-020: Tạo Admin Settings Page
- **Status**: ✅ Completed
- **Priority**: 🟢 Low
- **Dependencies**: TASK-011, TASK-012, TASK-013
- **File**: `frontend/src/admin/pages/AdminSettings.tsx`
- **Description**: Trang cài đặt hệ thống
- **Acceptance Criteria**:
  - [x] General settings form
  - [x] SEO settings form
  - [x] Email settings với test
  - [x] Security settings

---

### Common Components

#### TASK-021: Tạo DataTable Component
- **Status**: ✅ Completed
- **Priority**: 🔴 High
- **Dependencies**: None
- **File**: `frontend/src/admin/components/common/DataTable.tsx`
- **Description**: Reusable data table với đầy đủ tính năng
- **Acceptance Criteria**:
  - [x] Sortable columns
  - [x] Filterable
  - [x] Pagination
  - [x] Row selection
  - [x] Bulk actions support
  - [x] Loading state

---

#### TASK-022: Tạo StatCard Component
- **Status**: ✅ Completed
- **Priority**: 🟡 Medium
- **Dependencies**: None
- **File**: `frontend/src/admin/components/common/StatCard.tsx`
- **Description**: Card hiển thị statistics
- **Acceptance Criteria**:
  - [x] Title, value, icon
  - [x] Trend indicator (up/down)
  - [x] Percentage change
  - [x] Hover effects

---

#### TASK-023: Tạo ChartWrapper Component
- **Status**: ✅ Completed
- **Priority**: 🟡 Medium
- **Dependencies**: None
- **File**: `frontend/src/admin/components/common/ChartWrapper.tsx`
- **Description**: Wrapper cho charts với Recharts
- **Acceptance Criteria**:
  - [x] LineChart wrapper
  - [x] BarChart wrapper
  - [x] PieChart wrapper
  - [x] Responsive sizing
  - [x] Loading state

---

#### TASK-024: Tạo ConfirmDialog Component
- **Status**: ✅ Completed
- **Priority**: 🟡 Medium
- **Dependencies**: None
- **File**: `frontend/src/admin/components/common/ConfirmDialog.tsx`
- **Description**: Dialog xác nhận cho dangerous actions
- **Acceptance Criteria**:
  - [x] Title và message
  - [x] Confirm và Cancel buttons
  - [x] Variant (danger, warning, info)
  - [x] Loading state khi processing

---

---

## 📊 PHASE 2: CORE MODULES

*Tasks 006-020 đã cover Phase 2*

---

## 📈 PHASE 3: ANALYTICS & ADVANCED

#### TASK-025: Tạo Admin Analytics Controller
- **Status**: ✅ Completed
- **Priority**: 🟡 Medium
- **Dependencies**: TASK-005
- **File**: `backend/src/controllers/admin/adminAnalyticsController.ts`
- **Description**: Controller cho analytics data
- **Acceptance Criteria**:
  - [x] getTrafficAnalytics
  - [x] getUserAnalytics
  - [x] getContentAnalytics
  - [x] getSearchTrends
  - [x] exportReport

---

#### TASK-026: Tạo Admin Analytics Page
- **Status**: ✅ Completed
- **Priority**: 🟡 Medium
- **Dependencies**: TASK-012, TASK-023
- **File**: `frontend/src/admin/pages/AdminAnalytics.tsx`
- **Description**: Trang analytics dashboard
- **Acceptance Criteria**:
  - [x] Traffic charts
  - [x] User retention charts
  - [x] Content performance
  - [x] Date range selector
  - [x] Export functionality

---

#### TASK-027: Tạo Audit Log Page
- **Status**: ✅ Completed
- **Priority**: 🟢 Low
- **Dependencies**: TASK-001, TASK-012
- **File**: `frontend/src/admin/pages/AdminAuditLog.tsx`
- **Description**: Trang xem audit logs
- **Acceptance Criteria**:
  - [x] Log list với filters
  - [x] Search by admin, action, date
  - [x] Detail view
  - [x] Export to CSV

---

#### TASK-028: Tạo Settings Controller
- **Status**: ✅ Completed
- **Priority**: 🟡 Medium
- **Dependencies**: TASK-002, TASK-005
- **File**: `backend/src/controllers/admin/adminSettingsController.ts`
- **Description**: Controller cho system settings
- **Acceptance Criteria**:
  - [x] getSettings
  - [x] getCategorySettings
  - [x] updateSettings
  - [x] deleteSetting
  - [x] testEmail
  - [x] initializeSettings

---

#### TASK-029: Tạo Audit Log Controller
- **Status**: ✅ Completed
- **Priority**: 🟡 Medium
- **Dependencies**: TASK-001, TASK-005
- **File**: `backend/src/controllers/admin/adminAuditLogController.ts`
- **Description**: Controller cho audit logs
- **Acceptance Criteria**:
  - [x] listAuditLogs
  - [x] getAuditLogDetails
  - [x] getAuditLogStats
  - [x] exportAuditLogs
  - [x] clearOldAuditLogs

---

---

## 🧪 PHASE 4: TESTING

#### TASK-030: Unit Tests cho Models
- **Status**: ⬜ Not Started
- **Priority**: 🟡 Medium
- **Dependencies**: TASK-001, TASK-002, TASK-003
- **Files**: `backend/src/models/__tests__/`
- **Acceptance Criteria**:
  - [ ] AuditLog model tests
  - [ ] SystemSetting model tests
  - [ ] Report model tests

---

#### TASK-031: Integration Tests cho Admin API
- **Status**: ⬜ Not Started
- **Priority**: 🟡 Medium
- **Dependencies**: TASK-005 through TASK-010
- **Files**: `backend/src/routes/__tests__/admin.test.ts`
- **Acceptance Criteria**:
  - [ ] Dashboard endpoints tests
  - [ ] User management tests
  - [ ] Movie management tests
  - [ ] Auth middleware tests

---

#### TASK-032: E2E Tests cho Admin Panel
- **Status**: ⬜ Not Started
- **Priority**: 🟢 Low
- **Dependencies**: All frontend tasks
- **Files**: `frontend/e2e/admin/`
- **Acceptance Criteria**:
  - [ ] Login as admin
  - [ ] Navigate dashboard
  - [ ] CRUD operations
  - [ ] Bulk actions

---

---

## 📝 PROGRESS TRACKING

### Phase 1: Foundation
| Task | Status | Assigned | Completed |
|------|--------|----------|-----------|
| TASK-001 | ⬜ | - | - |
| TASK-002 | ⬜ | - | - |
| TASK-003 | ⬜ | - | - |
| TASK-004 | ⬜ | - | - |
| TASK-005 | ⬜ | - | - |
| TASK-011 | ⬜ | - | - |
| TASK-012 | ⬜ | - | - |
| TASK-013 | ⬜ | - | - |
| TASK-014 | ⬜ | - | - |

### Phase 2: Core Modules
| Task | Status | Assigned | Completed |
|------|--------|----------|-----------|
| TASK-006 | ⬜ | - | - |
| TASK-007 | ⬜ | - | - |
| TASK-008 | ⬜ | - | - |
| TASK-009 | ⬜ | - | - |
| TASK-010 | ⬜ | - | - |
| TASK-015 | ⬜ | - | - |
| TASK-016 | ⬜ | - | - |
| TASK-017 | ⬜ | - | - |
| TASK-018 | ⬜ | - | - |
| TASK-019 | ⬜ | - | - |
| TASK-020 | ⬜ | - | - |
| TASK-021 | ⬜ | - | - |
| TASK-022 | ⬜ | - | - |
| TASK-023 | ⬜ | - | - |
| TASK-024 | ⬜ | - | - |

### Phase 3: Analytics & Advanced
| Task | Status | Assigned | Completed |
|------|--------|----------|-----------|
| TASK-025 | ⬜ | - | - |
| TASK-026 | ⬜ | - | - |
| TASK-027 | ⬜ | - | - |

### Phase 4: Testing
| Task | Status | Assigned | Completed |
|------|--------|----------|-----------|
| TASK-028 | ⬜ | - | - |
| TASK-029 | ⬜ | - | - |
| TASK-030 | ⬜ | - | - |

---

## 🚀 QUICK START FOR AI AGENT

### Bắt đầu Phase 1 - Backend Models (có thể làm song song):
```
Các tasks không có dependency - có thể làm SONG SONG:
- TASK-001 (AuditLog Model)
- TASK-002 (SystemSetting Model)  
- TASK-003 (Report Model)

Sau khi hoàn thành các models trên:
- TASK-004 (Admin Middleware) - cần TASK-001
- TASK-005 (Admin Routes) - cần TASK-004
```

### Bắt đầu Phase 1 - Frontend Components (có thể làm song song):
```
Các tasks không có dependency - có thể làm SONG SONG:
- TASK-011 (Admin Layout)
- TASK-021 (DataTable Component)
- TASK-022 (StatCard Component)
- TASK-023 (ChartWrapper Component)
- TASK-024 (ConfirmDialog Component)
- TASK-013 (Admin Service)

Sau khi hoàn thành layout:
- TASK-012 (Admin Routes) - cần TASK-011
```

### Dependency Flow:
```
Backend:
TASK-001/002/003 (parallel) → TASK-004 → TASK-005 → TASK-006/007/008/009/010 (parallel)

Frontend:
TASK-011 + TASK-021/022/023/024 (parallel) → TASK-012 → TASK-013 → TASK-015/016/017/018/019 (với common components)
```

### Mẫu prompt cho AI:
```
Hãy thực hiện TASK-001 trong file ADMIN_TASKS.md:
- Đọc spec trong ADMIN_PANEL_PLAN.md
- Tạo file backend/src/models/AuditLog.ts
- Đảm bảo code follow TypeScript best practices
- Khi hoàn thành, update checkbox trong ADMIN_TASKS.md
- Commit với message: "feat(admin): implement AuditLog model [TASK-001]"
```

### Mẫu prompt làm nhiều tasks song song:
```
Hãy thực hiện đồng thời các tasks sau (không có dependency lẫn nhau):
- TASK-001: Tạo AuditLog Model
- TASK-002: Tạo SystemSetting Model
- TASK-003: Tạo Report Model

Với mỗi task:
- Đọc spec trong ADMIN_PANEL_PLAN.md
- Tạo file tương ứng
- Update checkbox khi hoàn thành
```

---

*Last Updated: January 2026*
