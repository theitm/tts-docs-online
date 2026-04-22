import { NextResponse } from 'next/server';
import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export const maxDuration = 300; 

export async function POST(req) {
  let tempFile = null;
  try {
    const { text, voice = 'vi-VN-HoaiMyNeural', rate = '0%' } = await req.json();
    
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Văn bản không được để trống' }, { status: 400 });
    }

    const tts = new EdgeTTS({
      voice: voice,
      lang: 'vi-VN',
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
      rate: rate,
    });

    // Tạo đường dẫn file tạm trong thư mục /tmp của Vercel
    const tempDir = os.tmpdir();
    tempFile = path.join(tempDir, `tts_${Date.now()}.mp3`);

    // Ghi file bằng ttsPromise
    await tts.ttsPromise(text, tempFile);

    // Đọc file vừa ghi lên thành Buffer
    const audioBuffer = await fs.readFile(tempFile);
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    });

  } catch (error) {
    console.error('Lỗi API TTS:', error);
    return NextResponse.json({ 
      error: 'Lỗi khi xử lý TTS', 
      details: error.message 
    }, { status: 500 });
  } finally {
    // Xóa file tạm sau khi đã gửi đi
    if (tempFile) {
      try {
        await fs.unlink(tempFile);
      } catch (e) {
        // Bỏ qua nếu file không tồn tại
      }
    }
  }
}
