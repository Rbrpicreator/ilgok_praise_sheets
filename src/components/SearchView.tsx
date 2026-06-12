import React, { useState, useMemo } from 'react';
import { Search, X, Maximize2, Trash2 } from 'lucide-react';
import { Sheet } from '../types';

interface SearchViewProps {
  sheets: Sheet[];
  onNavigate: () => void;
  onOpenViewer: (sheets: Sheet[], startIndex: number) => void;
  onDeleteSheet: (id: string) => void;
}

const CHORDS = ['All', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

export default function SearchView({ sheets, onNavigate, onOpenViewer, onDeleteSheet }: SearchViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChord, setSelectedChord] = useState('All');

  const filteredSheets = useMemo(() => {
    return sheets.filter(sheet => {
      const matchTerm = sheet.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchChord = selectedChord === 'All' || sheet.chord === selectedChord;
      return matchTerm && matchChord;
    });
  }, [sheets, searchTerm, selectedChord]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteSheet(id);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold">전체 악보 검색</h2>
        <button onClick={onNavigate} className="text-zinc-500 hover:text-zinc-900 transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-zinc-200 mb-10 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
          <input 
            type="text" 
            placeholder="악보 제목을 검색하세요..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium"
          />
        </div>
        <div className="md:w-48">
          <select 
            value={selectedChord}
            onChange={(e) => setSelectedChord(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all bg-white"
          >
            {CHORDS.map(c => (
              <option key={c} value={c}>{c === 'All' ? '전체 코드' : `${c} 코드`}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredSheets.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <Search size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg">검색된 악보가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredSheets.map((sheet, index) => (
            <div 
              key={sheet.id}
              onClick={() => onOpenViewer(filteredSheets, index)}
              className="group cursor-pointer bg-white rounded-2xl border border-zinc-100 overflow-hidden hover:shadow-xl hover:border-transparent transition-all flex flex-col"
            >
              <div className="aspect-[3/4] bg-zinc-100 relative overflow-hidden">
                <img 
                  src={sheet.imageUrl} 
                  alt={sheet.title} 
                  className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-10 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/90 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                    <Maximize2 size={24} className="text-zinc-900" />
                  </div>
                </div>
                
                <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                  <button 
                    onClick={(e) => handleDelete(e, sheet.id)}
                    className="bg-red-500/90 text-white p-2 rounded-full shadow-sm hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0"
                    title="악보 삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="bg-white/90 backdrop-blur font-bold px-3 py-1 rounded-full text-sm shadow-sm transition-transform">
                    {sheet.chord}
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg truncate" title={sheet.title}>{sheet.title}</h3>
                <p className="text-sm text-zinc-500 mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-300"></span> 
                  {new Date(sheet.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
