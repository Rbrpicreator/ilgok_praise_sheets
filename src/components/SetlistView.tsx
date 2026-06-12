import React, { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, X, Maximize2, Music, Trash2, Plus, GripHorizontal } from 'lucide-react';
import { Sheet, Setlist } from '../types';

interface SetlistViewProps {
  setlists: Setlist[];
  sheets: Sheet[];
  onNavigate: () => void;
  onOpenViewer: (sheets: Sheet[], startIndex: number) => void;
  onCreateSetlist: () => void;
  onDeleteSetlist: (id: string) => void;
  onReorderSetlist: (setId: string, from: number, to: number) => void;
}

export default function SetlistView({ setlists, sheets, onNavigate, onOpenViewer, onCreateSetlist, onDeleteSetlist, onReorderSetlist }: SetlistViewProps) {
  const [dragInfo, setDragInfo] = useState<{setlistId: string, index: number} | null>(null);

  const handleDragStart = (e: React.DragEvent, setlistId: string, index: number) => {
    setDragInfo({ setlistId, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, setlistId: string, dropIndex: number) => {
    e.preventDefault();
    if (dragInfo && dragInfo.setlistId === setlistId && dragInfo.index !== dropIndex) {
      onReorderSetlist(setlistId, dragInfo.index, dropIndex);
    }
    setDragInfo(null);
  };
  
  const getSheetsForSetlist = (sheetIds: string[]) => {
    return sheetIds.map(id => sheets.find(s => s.id === id)).filter(Boolean) as Sheet[];
  };

  const groupedSetlists = useMemo(() => {
    const groups: { [key: string]: Setlist[] } = {};
    
    // sort by date descending
    const sorted = [...setlists].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sorted.forEach(setlist => {
      // Validate date string
      const d = new Date(setlist.date);
      if (isNaN(d.getTime())) {
        if (!groups["기타"]) groups["기타"] = [];
        groups["기타"].push(setlist);
        return;
      }
      
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const date = d.getDate();
      
      // Calculate week of the month
      const firstDay = new Date(year, month - 1, 1).getDay();
      const week = Math.ceil((date + firstDay) / 7);
      
      const key = `${year}년 ${month}월 ${week}주차`;
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(setlist);
    });
    
    return groups;
  }, [setlists]);

  const groupKeys = Object.keys(groupedSetlists);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <CalendarIcon size={32} className="text-zinc-900" />
          주간 콘티 모아보기
        </h2>
        <div className="flex gap-4">
          <button 
            onClick={onCreateSetlist} 
            className="px-4 py-2 bg-zinc-900 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-800 transition-colors"
          >
            <Plus size={16} /> 새 콘티
          </button>
          <button onClick={onNavigate} className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors bg-white rounded-full">
            <X size={24} />
          </button>
        </div>
      </div>

      {groupKeys.length === 0 ? (
        <div className="text-center py-20 text-zinc-500 bg-zinc-50 rounded-3xl border border-zinc-100">
          <p className="text-lg">등록된 콘티가 없습니다.<br/>새 콘티 버튼을 눌러 추가해보세요.</p>
        </div>
      ) : (
        <div className="space-y-16">
          {groupKeys.map(weekLabel => (
            <div key={weekLabel} className="space-y-8">
              <h3 className="text-2xl font-extrabold text-zinc-900 border-b-2 border-zinc-900 pb-2 inline-block">
                {weekLabel}
              </h3>
              <div className="grid gap-8">
                {groupedSetlists[weekLabel].map(setlist => {
                  const listSheets = getSheetsForSetlist(setlist.sheetIds);
                  return (
                    <div key={setlist.id} className="bg-zinc-50 rounded-3xl p-8 border border-zinc-100 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-zinc-200 gap-4">
                        <div>
                          <h4 className="text-2xl font-bold text-zinc-900 mb-2">{setlist.title}</h4>
                          <p className="text-zinc-500 font-medium">{setlist.date}</p>
                        </div>
                        <div className="flex items-center gap-3 self-start md:self-auto">
                          <button 
                            onClick={() => onDeleteSetlist(setlist.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 p-3 rounded-full transition-colors"
                            title="콘티 삭제"
                          >
                            <Trash2 size={20} />
                          </button>
                          {listSheets.length > 0 && (
                            <button 
                              className="px-6 py-3 bg-white text-zinc-900 rounded-full flex items-center justify-center shadow-sm border border-zinc-200 cursor-pointer hover:bg-zinc-100 hover:border-zinc-300 transition-all font-bold text-sm"
                              onClick={() => onOpenViewer(listSheets, 0)}
                            >
                              <Music className="mr-2" size={18} /> 전체 악보 보기
                            </button>
                          )}
                        </div>
                      </div>

                      {listSheets.length === 0 ? (
                        <p className="text-zinc-500 text-center py-8">이 콘티에 포함된 악보가 없습니다.</p>
                      ) : (
                        <div className="overflow-x-auto pb-4">
                          <div className="flex gap-6 w-max">
                            {listSheets.map((sheet, index) => (
                              <div 
                                className={`flex flex-col items-center gap-4 transition-all duration-300 ${dragInfo?.setlistId === setlist.id && dragInfo.index === index ? 'opacity-40 scale-95' : 'opacity-100'}`} 
                                key={`${setlist.id}-${sheet.id}-${index}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, setlist.id, index)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, setlist.id, index)}
                                onDragEnd={() => setDragInfo(null)}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="cursor-grab active:cursor-grabbing hover:text-zinc-500 text-zinc-300" title="드래그하여 순서 변경">
                                    <GripHorizontal size={20} />
                                  </div>
                                  <div className="bg-zinc-900 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md shrink-0">
                                    {index + 1}
                                  </div>
                                </div>
                                
                                <div 
                                  onClick={() => onOpenViewer(listSheets, index)}
                                  className="w-[280px] bg-white rounded-2xl border border-zinc-200 overflow-hidden cursor-pointer group hover:shadow-xl hover:border-zinc-400 transition-all"
                                >
                                  <div className="aspect-[3/4] relative overflow-hidden bg-zinc-100">
                                    {sheet.imageUrl.endsWith('.pdf') ? (
                                      <div className="w-full h-full flex items-center justify-center bg-zinc-200 text-zinc-400 font-bold group-hover:bg-zinc-300 transition-colors">
                                        <span className="text-2xl tracking-widest">PDF</span>
                                      </div>
                                    ) : (
                                      <img 
                                        src={sheet.imageUrl} 
                                        alt={sheet.title} 
                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                      />
                                    )}
                                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-10 flex items-center justify-center">
                                        <div className="w-12 h-12 rounded-full bg-white/90 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                                          <Maximize2 size={24} className="text-zinc-900" />
                                        </div>
                                      </div>
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur font-bold px-3 py-1 rounded-full text-sm shadow-sm z-20">
                                      {sheet.chord}
                                    </div>
                                  </div>
                                  <div className="p-4 bg-white">
                                    <h5 className="font-bold truncate text-lg" title={sheet.title}>{sheet.title}</h5>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
