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
- **Status**: ⬜ Not Started
- **Priority**: 🔴 High
- **Dependencies**: None
- **File**: `backend/src/models/AuditLog.ts`
- **Description**: Tạo model để tracking tất cả admin actions
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 1 > AuditLog Model
- **Acceptance Criteria**:
  - [ ] Schema với các fields: admin, action, resource, resourceId, details, ipAddress, userAgent
  - [ ] Indexes cho query performance
  - [ ] TypeScript interface đầy đủ
  - [ ] Export default model

---

#### TASK-002: Tạo SystemSetting Model
- **Status**: ⬜ Not Started
- **Priority**: 🟡 Medium
- **Dependencies**: None
- **File**: `backend/src/models/SystemSetting.ts`
- **Description**: Tạo model để lưu site configuration
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 1 > SystemSetting Model
- **Acceptance Criteria**:
  - [ ] Schema với key, value, type, category, description
  - [ ] Index cho category-based queries
  - [ ] Type-safe value handling

---

#### TASK-003: Tạo Report Model
- **Status**: ⬜ Not Started
- **Priority**: 🟡 Medium
- **Dependencies**: None
- **File**: `backend/src/models/Report.ts`
- **Description**: Tạo model để xử lý user reports & flags
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 1 > Report Model
- **Acceptance Criteria**:
  - [ ] Schema đầy đủ với validation
  - [ ] Pre-save middleware để set targetModel
  - [ ] Indexes cho report management

---

#### TASK-004: Tạo Admin Authorization Middleware
- **Status**: ⬜ Not Started
- **Priority**: 🔴 High
- **Dependencies**: TASK-001
- **File**: `backend/src/middleware/adminAuth.ts`
- **Description**: Tạo middleware kiểm tra quyền admin với security logging
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 1 > Enhanced Authorization Middleware
- **Acceptance Criteria**:
  - [ ] AdminRole enum (SUPER_ADMIN, ADMIN, MODERATOR, ANALYST)
  - [ ] requireAdmin function với role validation
  - [ ] Security event logging cho failed attempts
  - [ ] Descriptive error messages

---

#### TASK-005: Tạo Admin Routes
- **Status**: ⬜ Not Started
- **Priority**: 🔴 High
- **Dependencies**: TASK-004
- **File**: `backend/src/routes/admin.ts`
- **Description**: Setup route structure cho admin API
- **Spec Reference**: ADMIN_PANEL_PLAN.md > All API Endpoints
- **Acceptance Criteria**:
  - [ ] Route prefix /api/admin
  - [ ] Apply protect và requireAdmin middleware
  - [ ] Import từ các admin controllers
  - [ ] Register trong server.ts

---

#### TASK-006: Tạo Admin Dashboard Controller
- **Status**: ⬜ Not Started
- **Priority**: 🔴 High
- **Dependencies**: TASK-005
- **File**: `backend/src/controllers/admin/adminDashboardController.ts`
- **Description**: Controller xử lý dashboard statistics
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 2 > Dashboard Module
- **Acceptance Criteria**:
  - [ ] getStats - tổng số users, movies, comments, ratings
  - [ ] getCharts - data cho biểu đồ
  - [ ] getActivity - recent activity feed
  - [ ] getAlerts - system alerts

---

#### TASK-007: Tạo Admin User Controller
- **Status**: ⬜ Not Started
- **Priority**: 🔴 High
- **Dependencies**: TASK-005
- **File**: `backend/src/controllers/admin/adminUserController.ts`
- **Description**: Controller quản lý users
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 2 > User Management
- **Acceptance Criteria**:
  - [ ] listUsers - paginated với search, filter, sort
  - [ ] getUserDetails - chi tiết user
  - [ ] updateUser - cập nhật thông tin
  - [ ] changeUserRole - thay đổi role
  - [ ] banUser / unbanUser - ban/unban user
  - [ ] deleteUser - xóa user
  - [ ] bulkAction - xử lý hàng loạt

---

#### TASK-008: Tạo Admin Movie Controller
- **Status**: ⬜ Not Started
- **Priority**: 🔴 High
- **Dependencies**: TASK-005
- **File**: `backend/src/controllers/admin/adminMovieController.ts`
- **Description**: Controller quản lý movies
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 2 > Movie Management
- **Acceptance Criteria**:
  - [ ] listMovies - paginated với filters
  - [ ] createMovie - thêm phim mới
  - [ ] updateMovie - cập nhật phim
  - [ ] deleteMovie - xóa phim
  - [ ] setFeatured - đặt phim nổi bật
  - [ ] importFromTMDB - import từ TMDB

---

#### TASK-009: Tạo Admin Comment Controller
- **Status**: ⬜ Not Started
- **Priority**: 🟡 Medium
- **Dependencies**: TASK-005
- **File**: `backend/src/controllers/admin/adminCommentController.ts`
- **Description**: Controller quản lý comments và moderation
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 2 > Comment Moderation
- **Acceptance Criteria**:
  - [ ] listComments - tất cả comments
  - [ ] updateCommentStatus - approve/reject
  - [ ] deleteComment - xóa comment
  - [ ] getModerationRules - lấy rules
  - [ ] updateModerationRules - cập nhật rules

---

#### TASK-010: Tạo Admin Report Controller
- **Status**: ⬜ Not Started
- **Priority**: 🟡 Medium
- **Dependencies**: TASK-003, TASK-005
- **File**: `backend/src/controllers/admin/adminReportController.ts`
- **Description**: Controller xử lý user reports
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 2 > Report Management
- **Acceptance Criteria**:
  - [ ] listReports - danh sách reports
  - [ ] getReportDetails - chi tiết report
  - [ ] updateReportStatus - thay đổi status
  - [ ] updateReportPriority - thay đổi priority
  - [ ] resolveReport - giải quyết report
  - [ ] rejectReport - từ chối report

---

### Frontend Infrastructure

#### TASK-011: Tạo Admin Layout Component
- **Status**: ⬜ Not Started
- **Priority**: 🔴 High
- **Dependencies**: None
- **Files**: 
  - `frontend/src/admin/components/layout/AdminLayout.tsx`
  - `frontend/src/admin/components/layout/AdminSidebar.tsx`
  - `frontend/src/admin/components/layout/AdminHeader.tsx`
- **Description**: Layout chính cho admin panel
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 1 > Frontend Structure
- **Acceptance Criteria**:
  - [ ] Sidebar với navigation menu
  - [ ] Header với user info, notifications
  - [ ] Responsive design
  - [ ] Dark theme theo design system

---

#### TASK-012: Tạo Admin Routes
- **Status**: ⬜ Not Started
- **Priority**: 🔴 High
- **Dependencies**: TASK-011
- **File**: `frontend/src/admin/routes/AdminRoutes.tsx`
- **Description**: Setup routing cho admin pages
- **Acceptance Criteria**:
  - [ ] Route /admin với AdminLayout
  - [ ] Lazy loading cho các pages
  - [ ] Protected routes cho admin only
  - [ ] Integrate vào main routes

---

#### TASK-013: Tạo Admin Service
- **Status**: ⬜ Not Started
- **Priority**: 🔴 High
- **Dependencies**: None
- **File**: `frontend/src/admin/services/adminService.ts`
- **Description**: API service cho admin endpoints
- **Acceptance Criteria**:
  - [ ] Dashboard API calls
  - [ ] User management API calls
  - [ ] Movie management API calls
  - [ ] Comment/Report API calls
  - [ ] Settings API calls

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
- **Status**: ⬜ Not Started
- **Priority**: 🔴 High
- **Dependencies**: TASK-011, TASK-012, TASK-013
- **File**: `frontend/src/admin/pages/AdminDashboard.tsx`
- **Description**: Trang dashboard chính
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 2 > Dashboard Module
- **Acceptance Criteria**:
  - [ ] StatCards cho overview statistics
  - [ ] Charts (line, bar, pie)
  - [ ] Recent activity feed
  - [ ] Quick actions

---

#### TASK-016: Tạo Admin Users Page
- **Status**: ⬜ Not Started
- **Priority**: 🔴 High
- **Dependencies**: TASK-011, TASK-012, TASK-013
- **File**: `frontend/src/admin/pages/AdminUsers.tsx`
- **Description**: Trang quản lý users
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 2 > User Management
- **Acceptance Criteria**:
  - [ ] DataTable với pagination
  - [ ] Search và filter
  - [ ] User actions (edit, ban, delete)
  - [ ] Bulk actions
  - [ ] User detail modal

---

#### TASK-017: Tạo Admin Movies Page
- **Status**: ⬜ Not Started
- **Priority**: 🔴 High
- **Dependencies**: TASK-011, TASK-012, TASK-013
- **File**: `frontend/src/admin/pages/AdminMovies.tsx`
- **Description**: Trang quản lý movies
- **Spec Reference**: ADMIN_PANEL_PLAN.md > Phase 2 > Movie Management
- **Acceptance Criteria**:
  - [ ] DataTable với pagination
  - [ ] Search và filter
  - [ ] Add/Edit movie form
  - [ ] TMDB import functionality
  - [ ] Bulk actions

---

#### TASK-018: Tạo Admin Comments Page
- **Status**: ⬜ Not Started
- **Priority**: 🟡 Medium
- **Dependencies**: TASK-011, TASK-012, TASK-013
- **File**: `frontend/src/admin/pages/AdminComments.tsx`
- **Description**: Trang moderation comments
- **Acceptance Criteria**:
  - [ ] Comment list với filters
  - [ ] Approve/Reject actions
  - [ ] Delete comment
  - [ ] View in context

---

#### TASK-019: Tạo Admin Reports Page
- **Status**: ⬜ Not Started
- **Priority**: 🟡 Medium
- **Dependencies**: TASK-011, TASK-012, TASK-013
- **File**: `frontend/src/admin/pages/AdminReports.tsx`
- **Description**: Trang xử lý reports
- **Acceptance Criteria**:
  - [ ] Report queue
  - [ ] Filter by type, status, priority
  - [ ] Review và resolve workflow
  - [ ] Action buttons

---

#### TASK-020: Tạo Admin Settings Page
- **Status**: ⬜ Not Started
- **Priority**: 🟢 Low
- **Dependencies**: TASK-011, TASK-012, TASK-013
- **File**: `frontend/src/admin/pages/AdminSettings.tsx`
- **Description**: Trang cài đặt hệ thống
- **Acceptance Criteria**:
  - [ ] General settings form
  - [ ] SEO settings form
  - [ ] Email settings với test
  - [ ] Security settings

---

### Common Components

#### TASK-021: Tạo DataTable Component
- **Status**: ⬜ Not Started
- **Priority**: 🔴 High
- **Dependencies**: None
- **File**: `frontend/src/admin/components/common/DataTable.tsx`
- **Description**: Reusable data table với đầy đủ tính năng
- **Acceptance Criteria**:
  - [ ] Sortable columns
  - [ ] Filterable
  - [ ] Pagination
  - [ ] Row selection
  - [ ] Bulk actions support
  - [ ] Loading state

---

#### TASK-022: Tạo StatCard Component
- **Status**: ⬜ Not Started
- **Priority**: 🟡 Medium
- **Dependencies**: None
- **File**: `frontend/src/admin/components/common/StatCard.tsx`
- **Description**: Card hiển thị statistics
- **Acceptance Criteria**:
  - [ ] Title, value, icon
  - [ ] Trend indicator (up/down)
  - [ ] Percentage change
  - [ ] Hover effects

---

#### TASK-023: Tạo ChartWrapper Component
- **Status**: ⬜ Not Started
- **Priority**: 🟡 Medium
- **Dependencies**: None
- **File**: `frontend/src/admin/components/common/ChartWrapper.tsx`
- **Description**: Wrapper cho charts với Recharts
- **Acceptance Criteria**:
  - [ ] LineChart wrapper
  - [ ] BarChart wrapper
  - [ ] PieChart wrapper
  - [ ] Responsive sizing
  - [ ] Loading state

---

#### TASK-024: Tạo ConfirmDialog Component
- **Status**: ⬜ Not Started
- **Priority**: 🟡 Medium
- **Dependencies**: None
- **File**: `frontend/src/admin/components/common/ConfirmDialog.tsx`
- **Description**: Dialog xác nhận cho dangerous actions
- **Acceptance Criteria**:
  - [ ] Title và message
  - [ ] Confirm và Cancel buttons
  - [ ] Variant (danger, warning, info)
  - [ ] Loading state khi processing

---

---

## 📊 PHASE 2: CORE MODULES

*Tasks 006-020 đã cover Phase 2*

---

## 📈 PHASE 3: ANALYTICS & ADVANCED

#### TASK-025: Tạo Admin Analytics Controller
- **Status**: ⬜ Not Started
- **Priority**: 🟡 Medium
- **Dependencies**: TASK-005
- **File**: `backend/src/controllers/admin/adminAnalyticsController.ts`
- **Description**: Controller cho analytics data
- **Acceptance Criteria**:
  - [ ] getTrafficAnalytics
  - [ ] getUserAnalytics
  - [ ] getContentAnalytics
  - [ ] getSearchTrends
  - [ ] exportReport

---

#### TASK-026: Tạo Admin Analytics Page
- **Status**: ⬜ Not Started
- **Priority**: 🟡 Medium
- **Dependencies**: TASK-012, TASK-023
- **File**: `frontend/src/admin/pages/AdminAnalytics.tsx`
- **Description**: Trang analytics dashboard
- **Acceptance Criteria**:
  - [ ] Traffic charts
  - [ ] User retention charts
  - [ ] Content performance
  - [ ] Date range selector
  - [ ] Export functionality

---

#### TASK-027: Tạo Audit Log Page
- **Status**: ⬜ Not Started
- **Priority**: 🟢 Low
- **Dependencies**: TASK-001, TASK-012
- **File**: `frontend/src/admin/pages/AdminAuditLog.tsx`
- **Description**: Trang xem audit logs
- **Acceptance Criteria**:
  - [ ] Log list với filters
  - [ ] Search by admin, action, date
  - [ ] Detail view
  - [ ] Export to CSV

---

---

## 🧪 PHASE 4: TESTING

#### TASK-028: Unit Tests cho Models
- **Status**: ⬜ Not Started
- **Priority**: 🟡 Medium
- **Dependencies**: TASK-001, TASK-002, TASK-003
- **Files**: `backend/src/models/__tests__/`
- **Acceptance Criteria**:
  - [ ] AuditLog model tests
  - [ ] SystemSetting model tests
  - [ ] Report model tests

---

#### TASK-029: Integration Tests cho Admin API
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

#### TASK-030: E2E Tests cho Admin Panel
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

### Bắt đầu Phase 1:
```
Thực hiện các tasks theo thứ tự:
1. TASK-001 (AuditLog Model) - không có dependency
2. TASK-002 (SystemSetting Model) - không có dependency  
3. TASK-003 (Report Model) - không có dependency
4. TASK-004 (Admin Middleware) - cần TASK-001
5. TASK-005 (Admin Routes) - cần TASK-004
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

---

*Last Updated: January 2026*
