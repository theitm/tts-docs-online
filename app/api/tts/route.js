import { NextResponse } from 'next/server';
import { EdgeTTS } from 'node-edge-tts';

export const maxDuration = 300; 

export async function POST(req) {
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

    const audioBuffer = await tts.toAudio(text);
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Lỗi API TTS:', error);
    return NextResponse.json({ 
      error: 'Lỗi khi xử lý TTS', 
      details: error.message 
    }, { status: 500 });
  }
}
