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
      lang: voice.substring(0, 5),
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
      rate: rate,
      timeout: 30000,
    });

    const tempDir = os.tmpdir();
    tempFile = path.join(tempDir, `tts_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`);

    console.log(`[TTS] Bắt đầu xử lý: voice=${voice}, rate=${rate}, chars=${text.length}`);
    console.log(`[TTS] Ghi file tạm: ${tempFile}`);

    await tts.ttsPromise(text, tempFile);

    const audioBuffer = await fs.readFile(tempFile);
    
    console.log(`[TTS] Thành công, kích thước: ${audioBuffer.length} bytes`);

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    });

  } catch (error) {
    // Log toàn bộ thông tin lỗi kể cả khi là non-Error object
    const errMsg = error instanceof Error 
      ? error.message 
      : (typeof error === 'string' ? error : JSON.stringify(error));
    const errStack = error instanceof Error ? error.stack : 'No stack';
    const errType = error instanceof Error ? error.name : typeof error;
    
    console.error('[TTS API ERROR] type:', errType);
    console.error('[TTS API ERROR] message:', errMsg);
    console.error('[TTS API ERROR] stack:', errStack);
    console.error('[TTS API ERROR] raw:', error);
    
    return NextResponse.json({ 
      error: 'Lỗi tại Server khi xử lý TTS', 
      details: errMsg,
      type: errType,
      raw: String(error)
    }, { status: 500 });
  } finally {
    if (tempFile) {
      try {
        await fs.unlink(tempFile);
      } catch (e) {
        // File có thể không tồn tại nếu lỗi xảy ra trước khi ghi
      }
    }
  }
}
