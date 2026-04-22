import './globals.css';

export const metadata = {
  title: 'TTS Docs Online - Chuyển văn bản thành giọng nói',
  description: 'Dựng web Next.js hỗ trợ nhập docs/txt hoặc gõ văn bản trực tiếp, chuyển đổi thành audio chất lượng cao với Edge TTS.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
