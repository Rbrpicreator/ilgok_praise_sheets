import React, { useState, useMemo } from 'react';
import { X, Check, Search, Plus, Minus } from 'lucide-react';
import { Sheet } from '../types';

interface CreateSetlistViewProps {
  sheets: Sheet[];
  onNavigate: () => void;
  onCreate: (title: string, date: string, sheetIds: string[]) => void;
}

export default function CreateSetlistView({ sheets, onNavigate, onCreate }: CreateSetlistViewProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [selectedSheetIds, setSelectedSheetIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSheets = useMemo(() => {
    return sheets.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [sheets, searchTerm]);

  const toggleSheet = (id: string) => {
    if (selectedSheetIds.includes(id)) {
      setSelectedSheetIds(selectedSheetIds.filter(s => s !== id));
    } else {
      setSelectedSheetIds([...selectedSheetIds, id]);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || selectedSheetIds.length === 0) {
      return;
    }
    onCreate(title, date, selectedSheetIds);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold">새 콘티 만들기</h2>
        <button onClick={onNavigate} className="text-zinc-500 hover:text-zinc-900 transition-colors">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleCreate} className="space-y-8 bg-white p-8 rounded-2xl border border-zinc-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">콘티 제목</label>
            <input 
              type="text" 
              placeholder="예: 주일 3부 예배 콘티" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">예배 날짜</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-sans font-medium"
              required
            />
          </div>
        </div>

        <div>
           <label className="block text-sm font-medium text-zinc-700 mb-4">구성 악보 선택 ({selectedSheetIds.length}개 선택됨)</label>
           
           <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="text" 
                placeholder="추가할 악보 제목 검색..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium"
              />
           </div>

           <div className="max-h-80 overflow-y-auto border border-zinc-200 rounded-xl divide-y divide-zinc-100 pb-1">
             {filteredSheets.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">검색 결과가 없습니다.</div>
             ) : (
                filteredSheets.map(sheet => {
                  const isSelected = selectedSheetIds.includes(sheet.id);
                  return (
                    <div 
                      key={sheet.id}
                      onClick={() => toggleSheet(sheet.id)}
                      className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${isSelected ? 'bg-zinc-50' : 'hover:bg-zinc-50'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-100 rounded overflow-hidden shrink-0">
                           <img src={sheet.imageUrl} alt={sheet.title} className="w-full h-full object-cover grayscale" />
                        </div>
                        <div>
                          <p className={`font-bold ${isSelected ? 'text-zinc-900' : 'text-zinc-700'}`}>{sheet.title}</p>
                          <span className="inline-block px-2 text-xs font-bold bg-white border border-zinc-200 rounded text-zinc-600 mt-1">
                            {sheet.chord}
                          </span>
                        </div>
                      </div>
                      <div>
                        {isSelected ? (
                           <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center">
                             <Minus size={16} />
                           </div>
                        ) : (
                           <div className="w-8 h-8 rounded-full border border-zinc-300 text-zinc-400 flex items-center justify-center">
                             <Plus size={16} />
                           </div>
                        )}
                      </div>
                    </div>
                  );
                })
             )}
           </div>
        </div>

        <button 
          type="submit" 
          disabled={!title || !date || selectedSheetIds.length === 0}
          className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-zinc-800 transition-colors disabled:bg-zinc-300 disabled:cursor-not-allowed"
        >
          <Check size={20} /> 콘티 저장하기
        </button>
      </form>
    </div>
  );
}
