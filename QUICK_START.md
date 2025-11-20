# 🚀 Quick Start Guide - RitoMovie

## Bắt Đầu Nhanh (5 phút)

### Bước 1: Cài Đặt Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (terminal mới)
cd frontend
npm install
```

### Bước 2: Tạo File Environment

**Backend** - Tạo file `backend/.env`:
```env
MONGODB_URI=mongodb+srv://ritoluki_db_user:nsn8sCHHQbSHia01@ritomovie.ldlgn68.mongodb.net/?appName=ritomovie
JWT_SECRET=movie_streaming_secret_key_2024
JWT_EXPIRE=7d
TMDB_API_KEY=e8a346d4009cee8172722801e56d055a
TMDB_BASE_URL=https://api.themoviedb.org/3
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Frontend** - Tạo file `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
```

### Bước 3: Chạy Ứng Dụng

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
✅ Server running at http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ App running at http://localhost:5173

### Bước 4: Sử Dụng

1. Mở trình duyệt: http://localhost:5173
2. Đăng ký tài khoản mới
3. Khám phá phim!

---

## ✨ Tính Năng Chính

- 🎬 **Xem thông tin phim**: Hàng ngàn bộ phim từ TMDB
- 🔍 **Tìm kiếm**: Tìm phim theo tên, thể loại, năm
- ❤️ **Danh sách yêu thích**: Lưu phim để xem sau
- ⭐ **Đánh giá**: Rate phim từ 1-5 sao
- 📊 **Lịch sử**: Theo dõi phim đã xem
- 🎨 **Giao diện đẹp**: Dark theme, Netflix-inspired
- 📱 **Responsive**: Hoạt động tốt trên mọi thiết bị

---

## 🛠️ Công Nghệ Sử Dụng

**Frontend:**
- React 18 + TypeScript
- Vite
- TailwindCSS
- Framer Motion
- React Query
- Zustand

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- TMDB API

---

## 📦 Cấu Trúc Dự Án

```
PersonalProject/
├── backend/          # API Server
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   └── .env
├── frontend/         # React App
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── .env
└── README.md
```

---

## 🎯 Các Trang Đã Xây Dựng

| Trang | URL | Mô Tả |
|-------|-----|-------|
| Home | `/` | Trang chủ với hero banner, movie rows |
| Browse | `/browse` | Duyệt phim với filter |
| Search | `/browse?q=...` | Tìm kiếm phim |
| Movie Details | `/movie/:id` | Chi tiết phim, trailer, cast |
| Watch | `/watch/:id` | Xem phim/trailer |
| My List | `/my-list` | Danh sách yêu thích (yêu cầu đăng nhập) |
| Profile | `/profile` | Quản lý tài khoản (yêu cầu đăng nhập) |
| Login | `/login` | Đăng nhập |
| Register | `/register` | Đăng ký |

---

## ❓ Gặp Vấn Đề?

### Backend không chạy
- Kiểm tra MongoDB connection string
- Chạy `npm install` trong folder backend

### Frontend không chạy
- Kiểm tra file `.env` đã tạo chưa
- Chạy `npm install` trong folder frontend

### Không load được phim
- Kiểm tra TMDB API key
- Kiểm tra kết nối internet
- Đảm bảo backend đang chạy

---

## 💡 Lưu Ý

- Cần 2 terminal: 1 cho backend, 1 cho frontend
- MongoDB đã được cấu hình sẵn (Atlas Cloud)
- TMDB API key đã được cung cấp
- Tất cả đã được setup sẵn, chỉ cần chạy!

---

**Chúc bạn thành công! 🎉**

