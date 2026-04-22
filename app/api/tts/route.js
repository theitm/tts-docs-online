import { NextResponse } from 'next/server';
import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export const maxDuration = 300; 

// Hàm splitText chuẩn từ ứng dụng gốc (MaxLength = 2000 + cơ chế gộp)
function splitText(text, maxLength = 2000) {
  const chunks = [];
  const paragraphs = text.split('\n');
  for (let p of paragraphs) {
    p = p.trim();
    if (!p) continue;
    if (p.length <= maxLength) {
      chunks.push(p);
    } else {
      const sentences = p.match(/[^.!?]+[.!?]+/g) || [p];
      let current = '';
      for (let s of sentences) {
        s = s.trim();
        if (!s) continue;
        if ((current.length + s.length) <= maxLength) {
          current += (current ? ' ' : '') + s;
        } else {
          if (current) chunks.push(current);
          while (s.length > maxLength) {
            chunks.push(s.substring(0, maxLength));
            s = s.substring(maxLength);
          }
          current = s;
        }
      }
      if (current) chunks.push(current);
    }
  }
  
  const merged = [];
  let current = '';
  for (const c of chunks) {
    if (current.length + c.length + 1 <= maxLength) {
      current += (current ? '\n' : '') + c;
    } else {
      if (current) merged.push(current);
      current = c;
    }
  }
  if (current) merged.push(current);
  return merged;
}

export async function POST(req) {
  try {
    const { text, voice = 'vi-VN-HoaiMyNeural', rate = '0%' } = await req.json();
    
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Văn bản không được để trống' }, { status: 400 });
    }

    const tts = new EdgeTTS({
        },
      });
    } finally {
      for (const file of tempFiles) {
        fs.unlink(file).catch(() => {});
      }
    }
    
  } catch (err) {
    console.error('[TTS API] Error:', err);
    return NextResponse.json({ 
      error: 'Lỗi khi chuyển đổi', 
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}
