'use client';
import { useState, useRef, useEffect } from 'react';

const VOICE_OPTIONS = [
  { id: 'vi-VN-HoaiMyNeural', name: '🇻🇳 Hoài My (Nữ)', gender: 'Female' },
  { id: 'vi-VN-NamMinhNeural', name: '🇻🇳 Nam Minh (Nam)', gender: 'Male' },
  { id: 'en-US-AndrewMultilingualNeural', name: '🌍 Andrew (Đa ngôn ngữ - Nam)', gender: 'Male' },
  { id: 'en-US-AriaNeural', name: '🇺🇸 Aria (Nữ)', gender: 'Female' },
  { id: 'en-US-GuyNeural', name: '🇺🇸 Guy (Nam)', gender: 'Male' },
  { id: 'en-GB-SoniaNeural', name: '🇬🇧 Sonia (Nữ)', gender: 'Female' },
  { id: 'fr-FR-DeniseNeural', name: '🇫🇷 Denise (Nữ)', gender: 'Female' },
  { id: 'ja-JP-NanamiNeural', name: '🇯🇵 Nanami (Nữ)', gender: 'Female' },
  { id: 'ko-KR-SunHiNeural', name: '🇰🇷 Sun-Hi (Nữ)', gender: 'Female' },
];

const RATE_OPTIONS = [
  { id: '-20%', name: 'Chậm' },
  { id: '0%', name: 'Bình thường' },
  { id: '+20%', name: 'Nhanh' },
  { id: '+50%', name: 'Rất nhanh' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('text');
  const [inputText, setInputText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('vi-VN-HoaiMyNeural');
  const [selectedRate, setSelectedRate] = useState('0%');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [history, setHistory] = useState([]);
  const [dirHandle, setDirHandle] = useState(null);
  const [mergeFiles, setMergeFiles] = useState([]);
  const [isMerging, setIsMerging] = useState(false);
  const [chunks, setChunks] = useState([]);
  const [chunkStatuses, setChunkStatuses] = useState({}); // { index: 'pending' | 'processing' | 'success' | 'error' }
  const [results, setResults] = useState([]);
  const [selectedChunks, setSelectedChunks] = useState(new Set());
  const [filePrefix, setFilePrefix] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  // Chọn thư mục để lưu file trực tiếp
  const handlePickDirectory = async () => {
    try {
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });
      setDirHandle(handle);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Trình duyệt của bạn không hỗ trợ hoặc bạn đã từ chối quyền truy cập thư mục.');
      }
    }
  };

  // Tự động cập nhật preview chunks khi inputText thay đổi
  useEffect(() => {
    if (inputText.trim()) {
      const splitChunks = splitText(inputText, 2000);
      setChunks(splitChunks);
      const initialStatuses = {};
      const initialSelected = new Set();
      splitChunks.forEach((_, i) => {
        initialStatuses[i] = 'pending';
        initialSelected.add(i); // Mặc định chọn tất cả
      });
      setChunkStatuses(initialStatuses);
      setSelectedChunks(initialSelected);
      setResults(new Array(splitChunks.length).fill(null));
    } else {
      setChunks([]);
      setChunkStatuses({});
      setSelectedChunks(new Set());
      setResults([]);
    }
  }, [inputText]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedText = localStorage.getItem('tts_input_cache');
    if (savedText) setInputText(savedText);
    
    const savedHistory = localStorage.getItem('tts_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Lỗi khi load lịch sử:', e);
      }
    }

    const savedPrefix = localStorage.getItem('tts_file_prefix');
    if (savedPrefix) setFilePrefix(savedPrefix);
  }, []);

  // Save input text on change
  useEffect(() => {
    localStorage.setItem('tts_input_cache', inputText);
  }, [inputText]);

  // Save history on change
  useEffect(() => {
    localStorage.setItem('tts_history', JSON.stringify(history));
  }, [history]);

  // Save prefix on change
  useEffect(() => {
    localStorage.setItem('tts_file_prefix', filePrefix);
  }, [filePrefix]);

  const sanitizeFileName = (name) => {
    // Loại bỏ các ký tự cấm trên Windows: \ / : * ? " < > |
    return name.replace(/[\\/:*?"<>|]/g, '').trim();
  };

  const addToHistory = (text) => {
    const newEntry = {
      id: Date.now(),
      text: text,
      textPreview: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      voice: selectedVoice,
      rate: selectedRate,
      timestamp: new Date().toLocaleString('vi-VN'),
    };
    setHistory(prev => [newEntry, ...prev].slice(0, 20)); // Keep last 20 entries
  };

  // Hàm splitText chuẩn từ ứng dụng gốc (MaxLength = 2000 + cơ chế gộp)
  const splitText = (text, maxLength = 2000) => {
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
  };

  const [retryInfo, setRetryInfo] = useState({ chunk: 0, attempt: 0 });
  const [totalErrors, setTotalErrors] = useState(0);

  const processSingleChunk = async (i, chunk) => {
    let success = false;
    let attempts = 0;
    const maxAttempts = 3;

    setChunkStatuses(prev => ({ ...prev, [i]: 'processing' }));

    while (!success && attempts < maxAttempts) {
      try {
        if (attempts > 0) {
          setRetryInfo({ chunk: i + 1, attempt: attempts });
          await new Promise(r => setTimeout(r, Math.pow(2, attempts) * 1000));
        }

        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: chunk,
            voice: selectedVoice,
            rate: selectedRate,
          }),
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.details || data.error || `Lỗi ở phần ${i+1}`);
        }
        
        const blob = await res.blob();
        
        // Cập nhật kết quả
        setResults(prev => {
          const newRes = [...prev];
          newRes[i] = blob;
          return newRes;
        });

        // Ghi file local
        if (dirHandle) {
          try {
            const prefix = filePrefix.trim() ? `${filePrefix.trim()}_` : '';
            const fileName = `${prefix}part_${String(i + 1).padStart(3, '0')}.mp3`;
            const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
          } catch (e) {}
        }

        setChunkStatuses(prev => ({ ...prev, [i]: 'success' }));
        setProgress(prev => ({ ...prev, current: Object.values({ ...chunkStatuses, [i]: 'success' }).filter(s => s === 'success').length }));
        setRetryInfo({ chunk: 0, attempt: 0 });
        success = true;
      } catch (err) {
        attempts++;
        setTotalErrors(prev => prev + 1);
        if (attempts >= maxAttempts) {
          setChunkStatuses(prev => ({ ...prev, [i]: 'error' }));
          throw err;
        }
      }
    }
  };

  const processTtsSequentially = async (textToProcess) => {
    const splitChunks = splitText(textToProcess, 2000);
    // Lưu ý: results và chunkStatuses đã được khởi tạo bởi useEffect khi inputText thay đổi
    
    let processedInThisSession = 0;

    for (let i = 0; i < splitChunks.length; i++) {
      // Chỉ xử lý nếu phần này được chọn và chưa hoàn thành
      if (selectedChunks.has(i) && chunkStatuses[i] !== 'success') {
        // Nghỉ 10 giây nếu đây không phải là phần đầu tiên được xử lý trong phiên này
        if (processedInThisSession > 0) {
          for (let s = 10; s > 0; s--) {
            setCountdown(s);
            await new Promise(r => setTimeout(r, 1000));
          }
          setCountdown(0);
        }
        
        await processSingleChunk(i, splitChunks[i]);
        processedInThisSession++;
      }
    }
    
    // Đợi một chút để đảm bảo state results đã cập nhật hết
    await new Promise(r => setTimeout(r, 500));
    return new Blob(results.filter(r => r !== null), { type: 'audio/mpeg' });
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setProgress({ current: 0, total: 0 });
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setInputText(data.text);
      setActiveTab('text');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConvertToAudio = async () => {
    if (!inputText.trim()) {
      setError('Vui lòng nhập văn bản hoặc tải file lên');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setAudioUrl(null);
    setProgress({ current: 0, total: 0 });
    
    try {
      const finalBlob = await processTtsSequentially(inputText);
      if (finalBlob) {
        const url = URL.createObjectURL(finalBlob);
        setAudioUrl(url);
        addToHistory(inputText);

        // Tự động lưu file gộp hoàn chỉnh vào thư mục local
        if (dirHandle) {
          try {
            const prefix = filePrefix.trim() ? `${filePrefix.trim()}_` : '';
            const fileName = `${prefix}full_audio_${Date.now()}.mp3`;
            const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(finalBlob);
            await writable.close();
            console.log('Đã lưu file gộp hoàn chỉnh vào thư mục.');
          } catch (saveErr) {
            console.error('Lỗi khi lưu file gộp:', saveErr);
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMergeFiles = async () => {
    if (mergeFiles.length === 0) return;
    setIsMerging(true);
    try {
      // Sắp xếp file theo tên để đảm bảo đúng thứ tự Part
      const sortedFiles = [...mergeFiles].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      const blob = new Blob(sortedFiles, { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      
      // Tự động tải về file gộp
      const link = document.createElement('a');
      link.href = url;
      link.download = `merged_audio_${Date.now()}.mp3`;
      link.click();
      
      setAudioUrl(url); // Cho phép nghe thử luôn
      setActiveTab('text'); // Quay lại tab chính để hiện trình phát
    } catch (err) {
      setError('Lỗi khi ghép file: ' + err.message);
    } finally {
      setIsMerging(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFileUpload(file);
  };

  const handleTest = async () => {
    const testText = 'Xin chào, đây là chức năng kiểm tra chuyển đổi văn bản thành giọng nói. Hệ thống đang hoạt động bình thường.';
    setInputText(testText);
    setActiveTab('text');
    setIsProcessing(true);
    setError(null);
    setAudioUrl(null);
    setProgress({ current: 0, total: 0 });
    
    try {
      const finalBlob = await processTtsSequentially(testText);
      if (finalBlob) {
        const url = URL.createObjectURL(finalBlob);
        setAudioUrl(url);
        addToHistory(testText);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="app-container animate-up">
      {/* Sidebar - Settings */}
      <aside className="sidebar">
        <div className="glass-panel" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px', background: 'linear-gradient(to right, #fff, var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              TTS Docs
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chuyển văn bản thành audio chất lượng cao</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Giọng đọc
              </label>
              <select 
                value={selectedVoice} 
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="glass-input"
              >
                {VOICE_OPTIONS.map(v => (
                  <option key={v.id} value={v.id} style={{ color: 'black' }}>{v.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tốc độ
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {RATE_OPTIONS.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRate(r.id)}
                    className={`glass-button ${selectedRate === r.id ? 'active' : ''}`}
                    style={{ padding: '8px', fontSize: '0.85rem', border: selectedRate === r.id ? '1px solid var(--primary)' : '' }}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'block', marginBottom: '0px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Lưu trữ Local
              </label>
              
              <input 
                type="text"
                className="glass-input"
                placeholder="Tiền tố tên file (ví dụ: Chuong_1)"
                value={filePrefix}
                onChange={(e) => setFilePrefix(sanitizeFileName(e.target.value))}
                style={{ padding: '10px', fontSize: '0.85rem' }}
              />

              <button 
                className={`glass-button ${dirHandle ? 'active' : 'pulse-warning'}`} 
                style={{ width: '100%', fontSize: '0.85rem', padding: '10px' }}
                onClick={handlePickDirectory}
              >
                {dirHandle ? `✅ Thư mục: ${dirHandle.name}` : '📂 Chọn thư mục lưu ngay'}
              </button>
              {!dirHandle && (
                <p style={{ fontSize: '0.7rem', color: '#fbbf24', marginTop: '-6px', textAlign: 'center', fontWeight: '500' }}>
                  ⚠️ Nên chọn thư mục để tránh mất audio khi lỗi
                </p>
              )}
            </div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {chunks.length > 0 && (
              <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Preview: <span style={{ color: 'white', fontWeight: '600' }}>{chunks.length} phần</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => setSelectedChunks(new Set(chunks.keys()))}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}
                    >
                      Tất cả
                    </button>
                    <button 
                      onClick={() => setSelectedChunks(new Set())}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>
                <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {chunks.map((_, i) => (
                    <div 
                      key={i} 
                      className={`chunk-item ${selectedChunks.has(i) ? 'selected' : ''}`}
                      onClick={() => {
                        const next = new Set(selectedChunks);
                        if (next.has(i)) next.delete(i);
                        else next.add(i);
                        setSelectedChunks(next);
                      }}
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        fontSize: '0.75rem', 
                        padding: '6px 8px', 
                        borderRadius: '4px', 
                        background: chunkStatuses[i] === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        border: selectedChunks.has(i) ? '1px solid var(--primary)' : '1px solid transparent',
                        opacity: selectedChunks.has(i) ? 1 : 0.5
                      }}
                    >
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedChunks.has(i)} 
                          onChange={() => {}} // Handle by parent div
                          style={{ pointerEvents: 'none' }}
                        />
                        <span>Phần {i + 1}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ 
                          color: chunkStatuses[i] === 'success' ? '#4ade80' : 
                                 chunkStatuses[i] === 'error' ? '#f87171' : 
                                 chunkStatuses[i] === 'processing' ? 'var(--primary)' : 'var(--text-muted)'
                        }}>
                          {chunkStatuses[i] === 'success' ? '✓ Xong' : 
                           chunkStatuses[i] === 'error' ? '✗ Lỗi' : 
                           chunkStatuses[i] === 'processing' ? '...' : 'Chờ'}
                        </span>
                        {chunkStatuses[i] === 'error' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); processSingleChunk(i, chunks[i]); }}
                            style={{ background: 'var(--primary)', border: 'none', borderRadius: '4px', color: 'black', fontSize: '0.65rem', padding: '2px 6px', cursor: 'pointer' }}
                          >
                            Thử lại
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isProcessing && progress.total > 0 && (
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600', marginBottom: '4px' }}>
                  Đang xử lý: {progress.current}/{progress.total} phần
                </div>
                {countdown > 0 && (
                  <div style={{ fontSize: '0.8rem', color: '#fbbf24', marginBottom: '8px', fontWeight: '600', animation: 'pulse 1s infinite' }}>
                    ⏳ Nghỉ giải lao: Tiếp tục sau {countdown} giây...
                  </div>
                )}
                {retryInfo.attempt > 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginBottom: '4px', animation: 'pulse 1.5s infinite' }}>
                    ⚠️ Lỗi phần {retryInfo.chunk}, đang thử lại lần {retryInfo.attempt}...
                  </div>
                )}
                {totalErrors > 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#f87171', marginBottom: '8px' }}>
                    Tổng số lỗi đã xảy ra: {totalErrors}
                  </div>
                )}
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--primary)', width: `${(progress.current / progress.total) * 100}%`, transition: 'width 0.3s ease' }} />
                </div>
              </div>
            )}
            <button 
              className="glass-button" 
              style={{ width: '100%' }}
              onClick={handleTest}
              disabled={isProcessing}
            >
              🔍 Test Chức Năng
            </button>
            <button 
              className="glass-button primary" 
              style={{ width: '100%', padding: '16px' }}
              onClick={handleConvertToAudio}
              disabled={isProcessing}
            >
              {isProcessing ? 'ĐANG XỬ LÝ...' : '🎙️ CHUYỂN AUDIO'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <section className="main-content">
        <div className="glass-panel" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
          <div className="tabs-header">
            <button 
              className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
              onClick={() => setActiveTab('text')}
            >
              Văn bản
            </button>
            <button 
              className={`tab-btn ${activeTab === 'file' ? 'active' : ''}`}
              onClick={() => setActiveTab('file')}
            >
              Upload File
            </button>
            <button 
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Lịch sử
            </button>
            <button 
              className={`tab-btn ${activeTab === 'merge' ? 'active' : ''}`}
              onClick={() => setActiveTab('merge')}
            >
              Ghép Audio
            </button>
          </div>

          {activeTab === 'text' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <textarea
                className="glass-input"
                style={{ flex: 1, resize: 'none', padding: '20px', fontSize: '1rem', lineHeight: '1.6', background: 'rgba(0,0,0,0.1)' }}
                placeholder="Nhập hoặc dán văn bản của bạn tại đây..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Số ký tự: <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{inputText.length.toLocaleString()}</span>
              </div>
            </div>
          )}
          
          {activeTab === 'file' && (
            <div 
              className={`dropzone ${isDragging ? 'active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".txt,.docx"
                onChange={(e) => handleFileUpload(e.target.files?.[0])}
              />
              <div style={{ fontSize: '48px' }}>📂</div>
              <div>
                <p style={{ fontSize: '1.1rem', fontWeight: '500', marginBottom: '4px' }}>Kéo thả file vào đây</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Hỗ trợ .txt và .docx</p>
              </div>
              <button className="glass-button" style={{ marginTop: '10px' }}>Chọn file từ máy</button>
            </div>
          )}

          {activeTab === 'history' && (
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Chưa có lịch sử chuyển đổi</div>
              ) : (
                history.map(item => (
                  <div 
                    key={item.id} 
                    className="glass-card" 
                    style={{ padding: '16px', cursor: 'pointer' }}
                    onClick={() => {
                      setInputText(item.text);
                      setSelectedVoice(item.voice);
                      setSelectedRate(item.rate);
                      setActiveTab('text');
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600' }}>{item.timestamp}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{VOICE_OPTIONS.find(v => v.id === item.voice)?.name} | {item.rate}</span>
                    </div>
                    <div style={{ fontSize: '0.95rem', color: 'white' }}>{item.textPreview}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>Nhấn để khôi phục</div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'merge' && (
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div 
                className="dropzone"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.accept = '.mp3';
                  input.onchange = (e) => {
                    if (e.target.files) {
                      setMergeFiles(Array.from(e.target.files));
                    }
                  };
                  input.click();
                }}
                style={{ padding: '40px', borderStyle: 'dashed' }}
              >
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>🧩</div>
                <p style={{ fontWeight: '500' }}>Chọn các file MP3 cần ghép</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Hệ thống sẽ tự sắp xếp theo tên file</p>
              </div>

              {mergeFiles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Danh sách file ({mergeFiles.length}):</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setMergeFiles([]); }}
                      style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      Xóa tất cả
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
                    {[...mergeFiles].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })).map((f, idx) => (
                      <div key={idx} className="glass-card" style={{ padding: '10px 16px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{f.name}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    className="glass-button primary" 
                    style={{ width: '100%', padding: '16px', marginTop: '10px' }}
                    onClick={handleMergeFiles}
                    disabled={mergeFiles.length === 0 || isMerging}
                  >
                    {isMerging ? 'ĐANG GHÉP FILE...' : '🔗 GHÉP VÀ TẢI VỀ'}
                  </button>
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5', fontSize: '0.9rem' }}>
              ⚠️ {error}
            </div>
          )}

          {audioUrl && (
            <div className="glass-card animate-up" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <audio 
                  ref={audioRef} 
                  src={audioUrl} 
                  controls 
                  style={{ width: '100%', height: '40px' }}
                  autoPlay
                />
              </div>
              <a 
                href={audioUrl} 
                download="tts-audio.mp3" 
                className="glass-button primary"
                style={{ padding: '10px 20px' }}
              >
                ⬇️ Tải về
              </a>
            </div>
          )}
        </div>
      </section>

      <style jsx global>{`
        .active {
          border-color: var(--primary) !important;
          color: white !important;
        }
        @keyframes pulse-warning {
          0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(251, 191, 36, 0); }
          100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
        }
        .pulse-warning {
          animation: pulse-warning 2s infinite;
          border-color: rgba(251, 191, 36, 0.3) !important;
        }
      `}</style>
    </main>
  );
}
