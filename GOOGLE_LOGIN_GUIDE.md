# 🔐 Google Login Integration Guide

## ✅ Đã hoàn thành implementation

### 📦 Packages đã cài đặt
- Frontend: `@react-oauth/google`
- Backend: `google-auth-library` (cần cài thêm bằng lệnh: `cd backend && npm install google-auth-library`)

---

## 🔧 Cấu hình môi trường

### Backend - `.env`
```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here (optional - không bắt buộc)
```

### Frontend - `.env`
```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

---

## 🌐 Cấu hình Google Cloud Console

### Bước 1: Tạo OAuth 2.0 Credentials

1. **Truy cập**: https://console.cloud.google.com/
2. **Tạo project** hoặc chọn project hiện có
3. **Enable Google+ API**:
   - APIs & Services → Library
   - Tìm "Google+ API" → Enable

4. **Tạo OAuth client ID**:
   - APIs & Services → Credentials
   - Create Credentials → OAuth client ID
   - Application type: Web application

5. **Cấu hình Authorized URIs**:

   **Development:**
   ```
   Authorized JavaScript origins:
   - http://localhost:5173
   
   Authorized redirect URIs:
   - http://localhost:5173
   ```

   **Production:**
   ```
   Authorized JavaScript origins:
   - https://yourdomain.com
   
   Authorized redirect URIs:
   - https://yourdomain.com
   ```

6. **Lưu Client ID** và thêm vào file `.env`

---

## 📁 Files đã tạo/cập nhật

### Frontend:
1. ✅ `src/main.tsx` - Wrapped app với GoogleOAuthProvider
2. ✅ `src/components/common/GoogleLoginButton.tsx` - Google login button component
3. ✅ `src/pages/Login.tsx` - Thêm Google login button
4. ✅ `src/services/authService.ts` - Thêm googleLogin method
5. ✅ `src/store/authStore.ts` - Thêm loginWithGoogle action
6. ✅ `src/lib/axios.ts` - Cập nhật interceptor để handle token

### Backend:
1. ✅ `src/controllers/authController.ts` - Thêm googleLogin controller
2. ✅ `src/routes/auth.ts` - Thêm `/auth/google` route
3. ✅ `src/models/User.ts` - Đã support custom token expiry

---

## 🎯 Cách hoạt động

### Flow đăng nhập Google:

1. **User clicks Google Login button** trên trang Login
2. **Google OAuth popup** hiện ra cho user chọn tài khoản
3. **Google returns credential** (JWT token) về frontend
4. **Frontend gửi credential** đến backend API `/auth/google`
5. **Backend verify token** với Google API
6. **Backend tạo/tìm user**:
   - Nếu email chưa tồn tại → Tạo user mới
   - Nếu đã tồn tại → Lấy thông tin user
7. **Backend generate JWT token** và trả về cho frontend
8. **Frontend lưu token** vào localStorage (remember me = true)
9. **User được redirect** về trang chủ

---

## 🧪 Testing

### 1. Kiểm tra Frontend:
```bash
cd frontend
npm run dev
```
- Mở http://localhost:5173/login
- Kiểm tra có hiển thị Google login button
- Click button và test login

### 2. Kiểm tra Backend:
```bash
cd backend
npm run dev
```
- Endpoint: `POST http://localhost:5000/api/auth/google`
- Body: `{ "credential": "google-jwt-token" }`

### 3. Test Flow hoàn chỉnh:
1. Click Google login button
2. Chọn tài khoản Google
3. Kiểm tra có redirect về trang chủ
4. Kiểm tra user info trong header/profile
5. Logout và login lại để test persistence

---

## 🔒 Bảo mật

### Đã implement:
- ✅ Token verification với Google API
- ✅ Secure password generation cho Google users
- ✅ JWT token với expiry
- ✅ Validate email từ Google payload

### Best practices:
- ⚠️ KHÔNG expose Client Secret ở frontend
- ⚠️ Luôn verify token ở backend
- ⚠️ Set token expiry hợp lý (30 days)
- ⚠️ Use HTTPS trong production

---

## 🐛 Troubleshooting

### Lỗi: "popup_closed_by_user"
- **Nguyên nhân**: User đóng popup trước khi hoàn tất
- **Giải pháp**: Không cần xử lý, đây là hành động bình thường

### Lỗi: "Invalid client ID"
- **Nguyên nhân**: Sai GOOGLE_CLIENT_ID
- **Giải pháp**: Kiểm tra lại Client ID trong .env

### Lỗi: "Redirect URI mismatch"
- **Nguyên nhân**: URL không khớp với Authorized URIs
- **Giải pháp**: Thêm URL vào Google Console

### Lỗi: "Google authentication failed"
- **Nguyên nhân**: Backend không verify được token
- **Giải pháp**: 
  - Kiểm tra `google-auth-library` đã cài
  - Kiểm tra GOOGLE_CLIENT_ID trong backend .env

---

## 📚 Tài liệu tham khảo

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [@react-oauth/google](https://www.npmjs.com/package/@react-oauth/google)
- [google-auth-library](https://www.npmjs.com/package/google-auth-library)

---

## 🚀 Next Steps (Optional)

### Có thể thêm thêm:
1. **Facebook Login** - Tương tự với Google
2. **GitHub Login** - Cho developers
3. **Apple Login** - Cho iOS users
4. **Two-Factor Authentication** - Tăng bảo mật
5. **Email Verification** - Xác thực email

---

## ✨ Features

- ✅ One-click Google login
- ✅ Auto create user từ Google info
- ✅ Sync avatar từ Google
- ✅ Remember me (30 days token)
- ✅ Secure password generation
- ✅ Beautiful UI với divider
- ✅ Error handling & loading states
- ✅ Toast notifications

---

**Created**: November 22, 2025  
**Author**: AI Assistant  
**Status**: ✅ Ready for testing
