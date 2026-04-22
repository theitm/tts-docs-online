import { NextResponse } from 'next/server';
import mammoth from 'mammoth';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy file' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';

    if (file.name.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (file.name.endsWith('.txt')) {
      text = buffer.toString('utf8');
    } else {
      return NextResponse.json({ error: 'Định dạng file không hỗ trợ. Chỉ nhận .txt hoặc .docx' }, { status: 400 });
    }

    return NextResponse.json({ text });
    
  } catch (err) {
    console.error('Extraction Error:', err);
    return NextResponse.json({ error: 'Lỗi khi đọc file' }, { status: 500 });
  }
}
