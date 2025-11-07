# 🚀 Development Build Setup Guide

## Mục tiêu

Tạo development build để có full notification functionality thay vì giới hạn của Expo Go.

## 🔧 Prerequisites

### 1. Tài khoản Expo (Free)

```bash
# Tạo account tại: https://expo.dev
# Hoặc đăng ký qua CLI:
npx expo register
```

### 2. Cài đặt EAS CLI

```bash
# Global installation
npm install -g eas-cli

# Hoặc dùng npx (không cần install global)
npx eas-cli
```

### 3. Login vào Expo

```bash
eas login
# Nhập email và password Expo account
```

## 📱 Build Development Build

### Bước 1: Initialize EAS

```bash
# Ở trong folder SmartNotes
cd SmartNotes
eas build:configure
```

### Bước 2: Build cho Android

```bash
# Build development build for Android
eas build --profile development --platform android

# Chờ khoảng 5-10 phút
# Kết quả: file .apk download link
```

### Bước 3: Build cho iOS (nếu có Mac)

```bash
# Build development build for iOS
eas build --profile development --platform ios

# Cần Apple Developer account ($99/year)
# Kết quả: file .ipa
```

## 📦 Cài đặt Development Build

### Android:

1. **Download APK**: Từ link EAS build cung cấp
2. **Enable Unknown Sources**: Settings → Security → Unknown Sources
3. **Install APK**: Tap vào file .apk đã download
4. **Open App**: Mở SmartNotes development build

### iOS:

1. **TestFlight**: EAS sẽ upload lên TestFlight
2. **Install via TestFlight**: Mở TestFlight → Install SmartNotes

## 🔄 Development Workflow

### 1. Chạy Development Server

```bash
# Terminal 1: Start Expo dev server
npm start

# Hoặc
expo start --dev-client
```

### 2. Connect Development Build

1. Mở **SmartNotes** development build (không phải Expo Go)
2. App sẽ tự connect đến dev server
3. Shake device → "Reload" để refresh

### 3. Live Reloading

- ✅ **Fast Refresh**: Code changes → auto reload
- ✅ **Full Notifications**: Tất cả notification features hoạt động
- ✅ **Native Modules**: Access đầy đủ native APIs

## ✨ Lợi ích Development Build vs Expo Go

| Feature                | Expo Go    | Development Build   |
| ---------------------- | ---------- | ------------------- |
| **UI Development**     | ✅ Perfect | ✅ Perfect          |
| **Notifications**      | ⚠️ Limited | ✅ **Full Support** |
| **Push Notifications** | ❌ No      | ✅ **Yes**          |
| **Background Tasks**   | ❌ No      | ✅ **Yes**          |
| **Native Modules**     | ⚠️ Limited | ✅ **All**          |
| **Camera**             | ✅ Yes     | ✅ Yes              |
| **Maps**               | ✅ Yes     | ✅ Yes              |
| **SQLite**             | ✅ Yes     | ✅ Yes              |
| **Performance**        | ⚠️ Good    | ✅ **Native**       |

## 🎯 Test Notification Features

Sau khi cài development build, test các features:

### 1. Permission Request

```
1. Vào Add Note
2. Set due date
3. Save note
4. → Popup permission request
5. Accept → Success message
```

### 2. Schedule Notification

```
1. Tạo note với due date 1 phút sau
2. Save note
3. Đợi 1 phút
4. → Nhận notification đúng lúc
```

### 3. Tap Navigation

```
1. Nhận notification
2. Tap vào notification
3. → App mở + navigate tới note detail
```

### 4. Manage Notifications

```
1. Vào Notifications tab
2. Xem list scheduled notifications
3. Cancel notification
4. → Notification bị hủy
```

## 🐛 Troubleshooting Development Build

### ❌ "eas: command not found"

```bash
# Solution 1: Install global
npm install -g eas-cli

# Solution 2: Use npx
npx eas build --profile development --platform android
```

### ❌ "Not logged in"

```bash
eas login
# Nhập Expo account credentials
```

### ❌ "Build failed"

```bash
# Check build logs
eas build:list

# Clear cache và thử lại
eas build --profile development --platform android --clear-cache
```

### ❌ "Development build không connect"

```bash
# Make sure cùng WiFi network
# Shake device → Enter URL manually
# http://YOUR_IP:8081
```

## 📚 Resources

- 📖 [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- 🎮 [Development Build Guide](https://docs.expo.dev/develop/development-builds/introduction/)
- 📱 [Testing on Device](https://docs.expo.dev/build/internal-distribution/)
- 💡 [Troubleshooting](https://docs.expo.dev/build/troubleshooting/)

## ⚡ Quick Commands

```bash
# Setup (once)
npm install -g eas-cli
eas login

# Build development build
eas build --profile development --platform android

# Start dev server
expo start --dev-client

# Check build status
eas build:list

# View build details
eas build:view BUILD_ID
```

## 📝 Next Steps

1. **Build development build**: `eas build --profile development --platform android`
2. **Install APK**: Download và cài đặt APK
3. **Test notifications**: Chạy `expo start --dev-client`
4. **Verify features**: Test notification scheduling, tap navigation
5. **Share with team**: Send APK link cho team members

---

**🎉 Sau khi setup development build, SmartNotes sẽ có FULL notification functionality!**
