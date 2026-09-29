# YTMusicPlayer - Android Studio

Đây là module Android đã được tách và sửa từ project gốc.

## Kiến trúc

- Kotlin + Jetpack Compose
- Media3 `MediaSessionService` + `MediaController` + ExoPlayer cho direct/local media
- Room cho Favorites / History / Playlist / Offline media
- YouTube Data API v3 tùy chọn cho tìm kiếm metadata
- YouTube video được mở bằng embedded player chính thức trong `YouTubePlayerActivity`
- Không trích xuất URL stream YouTube và không giả lập download YouTube

## Mở project

Mở thư mục `android/` bằng Android Studio.

Yêu cầu khuyến nghị:

- Android Studio bản hỗ trợ Android Gradle Plugin 8.3.x
- JDK 17
- Android SDK 34

Sau khi Gradle sync xong:

```bash
./gradlew :app:assembleDebug
```

APK debug sẽ nằm tại:

```text
app/build/outputs/apk/debug/app-debug.apk
```

## YouTube Data API (tùy chọn)

Nếu muốn tìm kiếm YouTube realtime:

1. Tạo YouTube Data API v3 key trong Google Cloud.
2. Copy `local.properties.example` thành `local.properties`.
3. Đặt:

```properties
YOUTUBE_API_KEY=...
```

Không commit `local.properties`.

Nếu không có key, tab Khám phá vẫn sử dụng dữ liệu curated có sẵn.

## Playback

### YouTube

Chạm một video YouTube -> ứng dụng mở `YouTubePlayerActivity` với embedded player chính thức.

### Direct media URL

Có thể dùng link HTTPS tới file media mà người dùng có quyền sử dụng, ví dụ MP3/MP4 từ máy chủ của họ. Những URL này được đưa vào Media3 để phát nền và điều khiển từ lock screen/Bluetooth.

### Offline

Chức năng download chỉ nhận direct media URL. File tải thành công mới được ghi vào Room; nếu file bị xóa, mục offline sẽ báo lỗi thay vì giả lập một file tồn tại.

## Lưu ý

Project gốc có một số phần demo như số liệu AdShield và URL SoundHelix. Các phần này đã được loại bỏ/đổi thành trạng thái trung thực trong bản Android này.
