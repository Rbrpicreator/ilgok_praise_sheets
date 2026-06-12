import React, { useState, useRef } from 'react';
import { Upload, X, Check, Image as ImageIcon, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { deleteFromDrive, uploadToDrive } from '../drive';

interface UploadViewProps {
  onUploadComplete: () => void;
  onNavigate: () => void;
}

const CHORDS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];

interface UploadItem {
  id: string;
  imagePreview: string; // base64
  mimeType: string;
  title: string;
  chord: string;
  analyzing: boolean;
}

export default function UploadView({ onUploadComplete, onNavigate }: UploadViewProps) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processFiles(Array.from(files) as File[]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files) {
      const fileArray = Array.from(files) as File[];
      processFiles(fileArray.filter(f => f.type.startsWith('image/') || f.type === 'application/pdf'));
    }
  };

  const processFiles = async (files: File[]) => {
    for (const file of files) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        // strip data URI scheme if needed, wait Drive multipart needs pure base64
        const base64Data = base64.split(',')[1];

        const newItem: UploadItem = {
          id: Math.random().toString(36).substring(7),
          imagePreview: base64,
          mimeType: file.type,
          title: '',
          chord: 'C',
          analyzing: true
        };
        
        setItems(prev => [...prev, newItem]);
        await analyzeSheet(newItem.id, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeSheet = async (id: string, base64: string) => {
    try {
      const response = await fetch('/api/analyze-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 })
      });
      
      if (!response.ok) {
        throw new Error(`AI 분석 오류: ${response.status}`);
      }

      const data = await response.json();
      
      setItems(prev => prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            title: data.title || '',
            chord: CHORDS.includes(data.chord) ? data.chord : 'C',
            analyzing: false
          };
        }
        return item;
      }));
    } catch (error) {
      console.error("Failed to analyze sheet", error);
      setItems(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, analyzing: false, title: item.title || 'AI 분석 실패 (직접 입력)' };
        }
        return item;
      }));
    }
  };

  const handleUpdateItem = (id: string, field: 'title' | 'chord', value: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || items.some(i => !i.title)) return;
    
    setIsUploading(true);
    try {
      for (const item of items) {
        const ext = item.mimeType === 'application/pdf' ? 'pdf' : item.mimeType.split('/')[1] || 'png';
        const filename = `${item.title}_${item.chord}.${ext}`;
        const base64Data = item.imagePreview.split(',')[1];
        
        await uploadToDrive(filename, item.mimeType, base64Data, {
          title: item.title,
          chord: item.chord
        });
      }
      
      setItems([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploadComplete();
    } catch (e: any) {
      console.error(e);
      alert(e.message || '업로드 실패. 다시 시도해주세요.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          새 악보 업로드
          <span className="bg-zinc-100 text-zinc-500 text-sm py-1 px-3 rounded-full flex items-center gap-1 font-medium tracking-tight">
            <Sparkles size={14} className="text-blue-500" /> AI 자동 분석
          </span>
        </h2>
        <button onClick={onNavigate} className="text-zinc-500 hover:text-zinc-900 transition-colors">
          <X size={24} />
        </button>
      </div>
      
      <div className="space-y-8">
        {/* Drag & Drop Zone (always at top) */}
        <div 
          className="border-2 border-dashed border-zinc-300 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-500 hover:bg-zinc-50 transition-all text-center bg-white"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            accept="image/*,application/pdf" 
            className="hidden" 
            multiple
            ref={fileInputRef} 
            onChange={handleFileChange}
          />
          <div className="py-8">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-500">
              <Upload size={32} />
            </div>
            <p className="font-semibold text-lg mb-1">이미지나 PDF를 클릭하거나 드래그하여 여러 장의 악보를 업로드하세요</p>
            <p className="text-zinc-500 text-sm">구글 드라이브에 안전하게 보관됩니다.</p>
          </div>
        </div>

        {/* Uploaded Items List */}
        {items.length > 0 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-6 p-6 bg-white rounded-2xl border border-zinc-200">
                   {/* Preview Image */}
                   <div className="w-full sm:w-32 h-32 flex-shrink-0 bg-zinc-100 rounded-xl overflow-hidden relative border border-zinc-200">
                     {item.imagePreview.includes('application/pdf') ? (
                       <div className="w-full h-full flex items-center justify-center bg-zinc-200 font-bold text-zinc-500 text-xl tracking-widest">PDF</div>
                     ) : (
                       <img src={item.imagePreview} alt="preview" className="w-full h-full object-cover" />
                     )}
                     {item.analyzing && (
                       <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center z-10 transition-all">
                          <Loader2 size={24} className="animate-spin text-zinc-900 mb-2" />
                          <span className="text-xs font-bold text-zinc-900 tracking-tighter">AI 분석중</span>
                       </div>
                     )}
                   </div>

                   {/* Form Fields */}
                   <div className="flex-1 flex flex-col justify-center gap-4">
                      {/* Title */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">악보 제목</label>
                        <input 
                          type="text" 
                          placeholder={item.analyzing ? "AI 분석 중입니다..." : "예: 은혜 (Grace)"}
                          value={item.title}
                          onChange={(e) => handleUpdateItem(item.id, 'title', e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl border ${item.analyzing ? 'border-zinc-200 bg-zinc-50 text-zinc-400' : 'border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900'} transition-all font-medium`}
                          disabled={item.analyzing}
                          required
                        />
                      </div>
                      
                      <div className="flex items-end justify-between gap-4">
                        {/* Chord (Key) */}
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-zinc-700 mb-1">코드 (Key)</label>
                          <select 
                            value={item.chord}
                            onChange={(e) => handleUpdateItem(item.id, 'chord', e.target.value)}
                            className={`w-full px-4 py-2.5 rounded-xl border ${item.analyzing ? 'border-zinc-200 bg-zinc-50 text-zinc-400' : 'border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white'} transition-all font-medium`}
                            disabled={item.analyzing}
                          >
                            {CHORDS.map(c => <option key={c} value={c}>{c} 코드</option>)}
                          </select>
                        </div>
                        {/* Remove Action */}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItem(item.id)}
                          className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors flex items-center justify-center"
                          title="삭제"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                   </div>
                </div>
              ))}
            </div>

            {/* Submit all button */}
            <div className="sticky bottom-6 mt-8">
               <button 
                type="submit" 
                disabled={items.length === 0 || items.some(i => i.analyzing || !i.title) || isUploading}
                className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-zinc-800 transition-colors shadow-2xl disabled:bg-zinc-300 disabled:cursor-not-allowed group"
              >
                 {items.some(i => i.analyzing) ? (
                   <><Loader2 size={20} className="animate-spin" /> 자동 분석 완료 대기중...</>
                 ) : isUploading ? (
                   <><Loader2 size={20} className="animate-spin" /> 구글 드라이브 업로드 중...</>
                 ) : (
                   <><Check size={20} /> {items.length}개의 악보 구글 드라이브에 저장하기</>
                 )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
