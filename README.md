# 🎙️ TTS Docs Online - Trình chuyển đổi Văn bản thành Giọng nói Chuyên nghiệp

Ứng dụng Web hiện đại giúp chuyển đổi văn bản và tài liệu (.txt, .docx) thành giọng nói chất lượng cao sử dụng công nghệ Microsoft Edge TTS. Được tối ưu hóa đặc biệt để xử lý các tài liệu dài (Audiobook) và hoạt động ổn định trên các nền tảng Serverless như Vercel.

![Thumbnail](https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&q=80&w=1000)

## ✨ Tính năng nổi bật

- **💎 Giao diện Premium:** Thiết kế theo phong cách Glassmorphism hiện đại, tinh tế và đáp ứng tốt trên mọi thiết bị.
- **📄 Hỗ trợ Đa định dạng:** Nhập văn bản trực tiếp hoặc tải file từ máy tính (.txt, .docx).
- **🚀 Xử lý Văn bản lớn:** Tự động chia nhỏ văn bản thành các đoạn 2000 ký tự để đảm bảo độ ổn định tuyệt đối.
- **📂 Lưu trữ Local trực tiếp:** Tích hợp File System Access API, cho phép lưu từng phần audio trực tiếp vào thư mục trên máy tính của bạn ngay khi đang xử lý.
- **🧩 Ghép Audio Thủ công:** Công cụ mạnh mẽ giúp gộp nhiều file MP3 thành một file duy nhất chỉ với vài cú click.
- **🛡️ Vượt giới hạn Vercel:** Cơ chế điều phối tuần tự tại Client với bộ đếm ngược 10 giây, giúp né tránh giới hạn Timeout của Vercel Free.
- **🔄 Cơ chế Auto-Retry:** Tự động thử lại lên đến 3 lần với thuật toán Exponential Backoff khi gặp lỗi đường truyền.
- **📊 Quản lý Thông minh:** Xem trước số phần chia nhỏ, theo dõi trạng thái từng đoạn và cho phép thử lại (Retry) thủ công từng phần riêng biệt.

## 🛠️ Công nghệ sử dụng

- **Framework:** [Next.js 14+](https://nextjs.org/) (App Router)
- **TTS Engine:** [node-edge-tts](https://github.com/mre6/node-edge-tts) (Microsoft Edge Read Aloud API)
- **Styling:** Vanilla CSS (Glassmorphism Design System)
- **File Processing:** [Mammoth.js](https://github.com/mvoloskov/mammoth.js) (Xử lý file .docx)
- **Deployment:** [Vercel](https://vercel.com/)

## 🚀 Hướng dẫn cài đặt và Chạy Local

1. **Clone dự án:**
   ```bash
   git clone https://github.com/theitm/tts-docs-online.git
   cd tts-docs-online
   ```

2. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

3. **Chạy môi trường Development:**
   ```bash
   npm run dev
   ```
   Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt để trải nghiệm.

## 📦 Triển khai trên Vercel

Dự án đã được cấu hình tối ưu cho Vercel Free. Để deploy:

1. Kết nối repository GitHub của bạn với Vercel.
2. Hoặc sử dụng Vercel CLI: `npx vercel`

**Lưu ý:** Do cơ chế vượt rào Timeout, hệ thống sẽ nghỉ 10 giây giữa mỗi phần 2000 ký tự. Đây là hành vi được thiết kế sẵn để đảm bảo tính ổn định.

## 🤝 Đóng góp

Mọi ý kiến đóng góp và báo lỗi vui lòng mở Issue hoặc gửi Pull Request.

---
Phát triển bởi nthquan.
